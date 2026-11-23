import { useEffect, useRef, useState } from 'react'
import { LOCAL_HOSTS, loadRecordsFromUrl } from './loadRecordsFromUrl'
import type { OwnData } from './OwnDataPanel'

type AddressLoadCallbacks = {
  onLoaded: (data: OwnData) => void
  onFailed: (error: unknown) => void
}

// People type "example.com/orders.json". Without a scheme it would load a page
// of this app, so add one: http:// for local dev servers, which rarely answer
// on https, and https:// for everything else. Only a "scheme://" at the start
// counts: `new URL` reads "localhost:5173/data.json" as the scheme "localhost:",
// and a query may hold another address.
const STARTS_WITH_SCHEME = /^[a-z][a-z\d+.-]*:\/\//i

export function withScheme(address: string): string {
  if (STARTS_WITH_SCHEME.test(address)) return address
  const withHttps = `https://${address}`
  const isLocal = URL.canParse(withHttps) && LOCAL_HOSTS.has(new URL(withHttps).hostname)
  return isLocal ? `http://${address}` : withHttps
}

// "example.com/orders.json?year=2025": short enough for the data bar, and the
// query keeps addresses that differ only by it apart.
export function describeAddress(address: string): string {
  try {
    const url = new URL(address, document.baseURI)
    return `${url.host}${url.pathname === '/' ? '' : url.pathname}${url.search}`
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

  async function load(typedAddress: string): Promise<void> {
    const address = withScheme(typedAddress)
    stop()
    const controller = new AbortController()
    current.current = controller
    setIsLoading(true)
    try {
      const rows = await loadRecordsFromUrl(address, controller.signal)
      if (!controller.signal.aborted) onLoaded({ name: describeAddress(address), rows })
    } catch (error) {
      if (controller.signal.aborted) return
      console.error(`[flex-reports app] Could not load records from ${address}.`, error)
      onFailed(error)
    } finally {
      if (current.current === controller) stop()
    }
  }

  useEffect(() => () => current.current?.abort(), [])

  return { isLoading, load, stop }
}
