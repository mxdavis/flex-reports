import { useEffect, useRef, useState } from 'react'
import { loadRecordsFromUrl } from './loadRecordsFromUrl'
import type { OwnData } from './OwnDataPanel'

type AddressLoadCallbacks = {
  onLoaded: (data: OwnData) => void
  onFailed: (error: unknown) => void
}

// "example.com/orders.json": short enough for the data bar.
export function describeAddress(address: string): string {
  try {
    const url = new URL(address, document.baseURI)
    return `${url.host}${url.pathname === '/' ? '' : url.pathname}`
  } catch {
    return address
  }
}

// Loads records from a web address, one load at a time. A stopped load (a new
// load, `stop`, or unmounting) never calls back, so data the visitor moved on
// from can't show up later.
export function useAddressLoad({ onLoaded, onFailed }: AddressLoadCallbacks) {
  const current = useRef<AbortController | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  function stop(): void {
    current.current?.abort()
    current.current = null
    setIsLoading(false)
  }

  async function load(address: string): Promise<void> {
    stop()
    const controller = new AbortController()
    current.current = controller
    setIsLoading(true)
    try {
      const rows = await loadRecordsFromUrl(address, controller.signal)
      if (!controller.signal.aborted) onLoaded({ name: describeAddress(address), rows })
    } catch (error) {
      if (!controller.signal.aborted) onFailed(error)
    } finally {
      if (current.current === controller) stop()
    }
  }

  useEffect(() => () => current.current?.abort(), [])

  return { isLoading, load, stop }
}
