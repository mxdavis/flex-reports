import { afterEach, describe, expect, it, vi } from 'vitest'
import { loadRecordsFromUrl, RECORDS_TIMEOUT_MS } from './loadRecordsFromUrl'
import { MAX_RECORDS_BYTES } from './recordsJson'

function mockFetch(response: Response | Error) {
  return vi.spyOn(globalThis, 'fetch').mockImplementation(async () => {
    if (response instanceof Error) throw response
    return response
  })
}

describe('loadRecordsFromUrl', () => {
  afterEach(() => {
    vi.restoreAllMocks()
    vi.useRealTimers()
  })

  it('loads a JSON list with a plain, private GET', async () => {
    const fetchSpy = mockFetch(new Response('[{"item":"Cable"}]'))

    await expect(loadRecordsFromUrl('sample-data.json')).resolves.toEqual([{ item: 'Cable' }])
    const [url, init] = fetchSpy.mock.calls[0]
    expect(String(url)).toBe(new URL('sample-data.json', document.baseURI).href)
    expect(init).toMatchObject({ credentials: 'omit', cache: 'no-store', referrerPolicy: 'no-referrer' })
    expect(init).not.toHaveProperty('redirect')
  })

  function redirectedTo(url: string): Response {
    const response = new Response('[{"item":"Cable"}]')
    Object.defineProperties(response, { redirected: { value: true }, url: { value: url } })
    return response
  }

  it('follows a redirect that ends on https', async () => {
    mockFetch(redirectedTo('https://cdn.example.com/data.json'))

    await expect(loadRecordsFromUrl('https://example.com/data.json')).resolves.toEqual([{ item: 'Cable' }])
  })

  it('refuses a redirect that ends on http', async () => {
    mockFetch(redirectedTo('http://cdn.example.com/data.json'))

    await expect(loadRecordsFromUrl('https://example.com/data.json'))
      .rejects.toThrow('This address redirected to one that isn\'t https.')
  })

  it.each([
    ['http://example.com/data.json', 'Use an address that starts with https://.'],
    ['https://user:secret@example.com/data.json', 'Remove the sign-in details from the address.'],
  ])('rejects %s before requesting it', async (address, message) => {
    const fetchSpy = mockFetch(new Response('[]'))

    await expect(loadRecordsFromUrl(address)).rejects.toThrow(message)
    expect(fetchSpy).not.toHaveBeenCalled()
  })

  it.each([
    [new Response('nope', { status: 404 }), 'The address answered with an error (404).'],
    [new Response('{not json'), 'This isn\'t valid JSON.'],
    [new Response('[{"item":"Cable"},{"item":"Pl'), 'may be cut off'],
    [new Response('{"rows":[]}'), 'Provide just the list of records'],
    [new Response('[]', { headers: { 'content-length': String(MAX_RECORDS_BYTES + 1) } }), 'larger than 5 MB'],
    [new Response(`["${'x'.repeat(MAX_RECORDS_BYTES)}"]`), 'larger than 5 MB'],
    [new TypeError('Failed to fetch'), 'allows browser access (CORS)'],
  ])('explains a failed load in plain words (%#)', async (response, message) => {
    mockFetch(response)

    await expect(loadRecordsFromUrl('https://example.com/data.json')).rejects.toThrow(message)
  })

  it('gives up after the time limit', async () => {
    vi.useFakeTimers()
    vi.spyOn(globalThis, 'fetch').mockImplementation((_url, init) => new Promise((_resolve, reject) => {
      init?.signal?.addEventListener('abort', () => reject(new DOMException('Aborted', 'AbortError')))
    }))

    const result = expect(loadRecordsFromUrl('https://example.com/slow.json')).rejects.toThrow('took too long')
    await vi.advanceTimersByTimeAsync(RECORDS_TIMEOUT_MS)
    await result
  })

  it('passes the caller\'s cancel through as an AbortError', async () => {
    vi.spyOn(globalThis, 'fetch').mockImplementation((_url, init) => new Promise((_resolve, reject) => {
      init?.signal?.addEventListener('abort', () => reject(new DOMException('Aborted', 'AbortError')))
    }))
    const controller = new AbortController()

    const result = loadRecordsFromUrl('https://example.com/data.json', controller.signal)
    controller.abort()

    await expect(result).rejects.toMatchObject({ name: 'AbortError' })
  })
})
