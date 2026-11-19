import { useCallback, useEffect, useState } from 'react'
import type { ReportRow } from '../services/adapters'
import { loadRecordsFromUrl } from './loadRecordsFromUrl'
import { RecordsLoadError } from './recordsJson'

type RecordsState = { rows?: ReportRow[], error?: string }

// Loads records from `url`, and again on reload(). A newer load replaces an
// older one that hasn't finished, so a slow response never wins.
export function useRecordsFromUrl(url: string) {
  const [state, setState] = useState<RecordsState>({})
  const [attempt, setAttempt] = useState(0)

  useEffect(() => {
    const controller = new AbortController()
    loadRecordsFromUrl(url, controller.signal)
      .then((rows) => setState({ rows }))
      .catch((error: unknown) => {
        if (controller.signal.aborted) return
        console.error(`[flex-reports app] Could not load records from ${url}.`, error)
        setState({ error: error instanceof RecordsLoadError ? error.message : 'Couldn\'t load the data. Try again.' })
      })
    return () => controller.abort()
  }, [attempt, url])

  const reload = useCallback(() => {
    setState({})
    setAttempt((count) => count + 1)
  }, [])

  return { ...state, reload }
}
