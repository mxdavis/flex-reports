import { useEffect, useState } from 'react'
import { loadSandboxData, type SandboxData } from '../../../services/adapters'

// Loads the sample data only when sandbox mode needs it.
export function useSandboxData(isSandbox: boolean): SandboxData | null {
  const [sandboxData, setSandboxData] = useState<SandboxData | null>(null)

  useEffect(() => {
    if (!isSandbox) return
    let isCurrent = true
    loadSandboxData()
      .then((data) => {
        if (isCurrent) setSandboxData(data)
      })
      .catch((error: unknown) => {
        console.error('[flex-reports] Could not load the sandbox sample data.', error)
      })
    return () => {
      isCurrent = false
    }
  }, [isSandbox])

  return isSandbox ? sandboxData : null
}
