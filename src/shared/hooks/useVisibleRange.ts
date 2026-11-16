import { useCallback, useEffect, useRef, useState, type RefObject } from 'react'

const DEFAULT_ROW_HEIGHT = 37
// Extra rows above and below the viewport, so fast scrolling doesn't flash blanks.
const OVERSCAN_ROWS = 12
// Used until the scroll container has been measured (first paint, and jsdom).
const FALLBACK_VIEWPORT_HEIGHT = 1500

export type VisibleRange = {
  start: number
  end: number
  paddingTop: number
  paddingBottom: number
  // Attach to one rendered row so the real row height is used.
  measureRow: (row: HTMLTableRowElement | null) => void
}

// Windowing for fixed-height rows: works out which rows are inside the scroll
// container's viewport, so only those are drawn.
export function useVisibleRange(scrollRef: RefObject<HTMLElement | null>, rowCount: number): VisibleRange {
  const [viewport, setViewport] = useState({ scrollTop: 0, height: 0 })
  const [rowHeight, setRowHeight] = useState(DEFAULT_ROW_HEIGHT)

  useEffect(() => {
    const element = scrollRef.current
    if (!element) return
    const update = () => setViewport({ scrollTop: element.scrollTop, height: element.clientHeight })
    update()
    element.addEventListener('scroll', update, { passive: true })
    const observer = typeof ResizeObserver === 'undefined' ? null : new ResizeObserver(update)
    observer?.observe(element)
    return () => {
      element.removeEventListener('scroll', update)
      observer?.disconnect()
    }
  }, [scrollRef])

  // Measured once. Re-measuring whichever row happens to be first let slightly
  // different row heights (group vs detail) feed back into the window and loop.
  const hasMeasured = useRef(false)
  const measureRow = useCallback((row: HTMLTableRowElement | null) => {
    if (hasMeasured.current || !row) return
    const height = row.getBoundingClientRect().height
    if (height <= 0) return
    hasMeasured.current = true
    setRowHeight(height)
  }, [])

  const viewportHeight = viewport.height || FALLBACK_VIEWPORT_HEIGHT
  const start = Math.min(rowCount, Math.max(0, Math.floor(viewport.scrollTop / rowHeight) - OVERSCAN_ROWS))
  const end = Math.min(rowCount, Math.ceil((viewport.scrollTop + viewportHeight) / rowHeight) + OVERSCAN_ROWS)

  return {
    start,
    end,
    paddingTop: start * rowHeight,
    paddingBottom: Math.max(0, rowCount - end) * rowHeight,
    measureRow,
  }
}
