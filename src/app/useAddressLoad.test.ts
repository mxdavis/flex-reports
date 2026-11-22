import { act, renderHook } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { loadRecordsFromUrl } from './loadRecordsFromUrl'
import { describeAddress, useAddressLoad } from './useAddressLoad'

vi.mock('./loadRecordsFromUrl', () => ({ loadRecordsFromUrl: vi.fn() }))

const ROWS = [{ product: 'Cable' }]

// A load that finishes only when the test says so, like a slow site.
function slowLoad() {
  let finish: () => void = () => undefined
  vi.mocked(loadRecordsFromUrl).mockImplementationOnce(() => new Promise((resolve) => {
    finish = () => resolve(ROWS)
  }))
  return () => finish()
}

function renderAddressLoad() {
  const onLoaded = vi.fn()
  const onFailed = vi.fn()
  const hook = renderHook(() => useAddressLoad({ onLoaded, onFailed }))
  return { ...hook, onLoaded, onFailed }
}

describe('useAddressLoad', () => {
  afterEach(() => {
    vi.mocked(loadRecordsFromUrl).mockReset()
  })

  it('names the data after the address and stops loading', async () => {
    vi.mocked(loadRecordsFromUrl).mockResolvedValueOnce(ROWS)
    const { result, onLoaded } = renderAddressLoad()

    await act(() => result.current.load('https://example.com/orders.json'))

    expect(onLoaded).toHaveBeenCalledWith({ name: 'example.com/orders.json', rows: ROWS })
    expect(result.current.isLoading).toBe(false)
  })

  it('reports a failed load', async () => {
    const error = new Error('offline')
    vi.mocked(loadRecordsFromUrl).mockRejectedValueOnce(error)
    const { result, onFailed } = renderAddressLoad()

    await act(() => result.current.load('https://example.com/orders.json'))

    expect(onFailed).toHaveBeenCalledWith(error)
  })

  it('never calls back for a load that was stopped, even if it finishes', async () => {
    const finish = slowLoad()
    const { result, onLoaded, onFailed } = renderAddressLoad()

    let loading: Promise<void> = Promise.resolve()
    act(() => {
      loading = result.current.load('https://example.com/slow.json')
    })
    expect(result.current.isLoading).toBe(true)
    act(() => result.current.stop())
    finish()
    await act(() => loading)

    expect(onLoaded).not.toHaveBeenCalled()
    expect(onFailed).not.toHaveBeenCalled()
    expect(result.current.isLoading).toBe(false)
  })

  it('keeps only the newest load', async () => {
    const finishFirst = slowLoad()
    vi.mocked(loadRecordsFromUrl).mockResolvedValueOnce(ROWS)
    const { result, onLoaded } = renderAddressLoad()

    let first: Promise<void> = Promise.resolve()
    act(() => {
      first = result.current.load('https://example.com/first.json')
    })
    await act(() => result.current.load('https://example.com/second.json'))
    finishFirst()
    await act(() => first)

    expect(onLoaded).toHaveBeenCalledTimes(1)
    expect(onLoaded).toHaveBeenCalledWith({ name: 'example.com/second.json', rows: ROWS })
  })

  it('stops the load on unmount', () => {
    slowLoad()
    const { result, unmount } = renderAddressLoad()
    act(() => {
      void result.current.load('https://example.com/slow.json')
    })
    const signal = vi.mocked(loadRecordsFromUrl).mock.calls[0][1]

    unmount()

    expect(signal?.aborted).toBe(true)
  })
})

describe('describeAddress', () => {
  it('drops the scheme, and the slash of a bare site', () => {
    expect(describeAddress('https://example.com/')).toBe('example.com')
    expect(describeAddress('https://example.com:8443/a/b.json?x=1')).toBe('example.com:8443/a/b.json')
  })
})
