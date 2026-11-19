import type { ReportRow } from '../services/adapters'
import { MAX_RECORDS_BYTES, parseRecordsJson, RecordsLoadError } from './recordsJson'

export const RECORDS_TIMEOUT_MS = 15_000

const LOCAL_HOSTS = new Set(['localhost', '127.0.0.1', '[::1]'])

function resolveUrl(address: string): URL {
  let url: URL
  try {
    url = new URL(address, document.baseURI)
  } catch {
    throw new RecordsLoadError('This isn\'t a web address.')
  }
  const isSameSite = url.origin === window.location.origin
  if (url.protocol !== 'https:' && !isSameSite && !LOCAL_HOSTS.has(url.hostname)) {
    throw new RecordsLoadError('Use an address that starts with https://.')
  }
  if (url.username || url.password) {
    throw new RecordsLoadError('Remove the sign-in details from the address.')
  }
  return url
}

async function readText(response: Response): Promise<string> {
  const declaredBytes = Number(response.headers.get('content-length'))
  if (declaredBytes > MAX_RECORDS_BYTES) throw new RecordsLoadError('This data is larger than 5 MB.')
  if (!response.body) return response.text()

  const reader = response.body.getReader()
  const chunks: Uint8Array[] = []
  let bytes = 0
  for (;;) {
    const { done, value } = await reader.read()
    if (done) break
    bytes += value.byteLength
    if (bytes > MAX_RECORDS_BYTES) {
      await reader.cancel()
      throw new RecordsLoadError('This data is larger than 5 MB.')
    }
    chunks.push(value)
  }
  const all = new Uint8Array(bytes)
  let offset = 0
  for (const chunk of chunks) {
    all.set(chunk, offset)
    offset += chunk.byteLength
  }
  return new TextDecoder().decode(all)
}

// Loads a JSON list of records with a plain GET: no cookies, no cache, no
// referrer, no redirects, a time limit and a size limit, then the same JSON
// check as pasted data. Aborting `signal` rejects with the browser's AbortError.
export async function loadRecordsFromUrl(address: string, signal?: AbortSignal): Promise<ReportRow[]> {
  const url = resolveUrl(address)
  const controller = new AbortController()
  let timedOut = false
  const timer = setTimeout(() => {
    timedOut = true
    controller.abort()
  }, RECORDS_TIMEOUT_MS)
  const stopOnAbort = () => controller.abort()
  signal?.addEventListener('abort', stopOnAbort)
  if (signal?.aborted) controller.abort()

  try {
    let response: Response
    try {
      response = await fetch(url, {
        credentials: 'omit',
        cache: 'no-store',
        referrerPolicy: 'no-referrer',
        redirect: 'error',
        signal: controller.signal,
      })
    } catch (error) {
      if (signal?.aborted) throw error
      if (timedOut) throw new RecordsLoadError('The data took too long to arrive. Try again.')
      throw new RecordsLoadError('Couldn\'t load this address. Check it, and ask its owner to allow browser access (CORS).')
    }
    if (!response.ok) throw new RecordsLoadError(`The address answered with an error (${response.status}).`)
    return parseRecordsJson(await readText(response))
  } finally {
    clearTimeout(timer)
    signal?.removeEventListener('abort', stopOnAbort)
  }
}
