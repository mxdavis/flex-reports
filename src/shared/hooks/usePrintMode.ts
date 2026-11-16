import { createContext, useCallback, useEffect, useRef, useState, type RefObject } from 'react'
import { flushSync } from 'react-dom'

// True while the page is printing, so windowed lists draw every row on paper.
export const PrintModeContext = createContext(false)

const ISOLATE_CLASS = 'fr-print-isolate'
const TARGET_CLASS = 'fr-print-target'

// Print support for a component embedded in someone else's page:
// - Before any print (our button or the browser's own Ctrl+P), it switches to
//   print mode synchronously, so the content is complete before layout.
// - print() prints only `rootRef` (the rest of the host page is hidden for that
//   print) and suggests `title` as the file name for Save as PDF.
export function usePrintMode(rootRef: RefObject<HTMLElement | null>, title: string) {
  const [isPrinting, setIsPrinting] = useState(false)
  const restoreRef = useRef<(() => void) | null>(null)

  useEffect(() => {
    const handleBeforePrint = () => flushSync(() => setIsPrinting(true))
    const handleAfterPrint = () => {
      setIsPrinting(false)
      restoreRef.current?.()
      restoreRef.current = null
    }
    window.addEventListener('beforeprint', handleBeforePrint)
    window.addEventListener('afterprint', handleAfterPrint)
    return () => {
      window.removeEventListener('beforeprint', handleBeforePrint)
      window.removeEventListener('afterprint', handleAfterPrint)
    }
  }, [])

  const print = useCallback(() => {
    const root = rootRef.current
    if (!root) return
    const previousTitle = document.title
    document.body.classList.add(ISOLATE_CLASS)
    root.classList.add(TARGET_CLASS)
    document.title = title
    restoreRef.current = () => {
      document.body.classList.remove(ISOLATE_CLASS)
      root.classList.remove(TARGET_CLASS)
      document.title = previousTitle
    }
    window.print()
  }, [rootRef, title])

  return { isPrinting, print }
}
