import { useEffect, useRef, useState, type KeyboardEvent } from 'react'

function normalize(value: string): string {
  return value.trim().toLowerCase()
}

// Unique options containing the query, case-insensitively, in their given order.
export function filterOptions(options: string[], query: string): string[] {
  const normalizedQuery = normalize(query)
  const uniqueOptions = Array.from(new Set(options))
  if (!normalizedQuery) return uniqueOptions
  return uniqueOptions.filter((option) => normalize(option).includes(normalizedQuery))
}

// The suggestion-list behavior shared by the autocomplete inputs: open/closed,
// closing on an outside click, the highlighted option, and arrow/Enter/Escape.
export function useOptionsList(options: string[], onSelect: (option: string) => void) {
  const containerRef = useRef<HTMLDivElement | null>(null)
  const [isOpen, setIsOpen] = useState(false)
  const [highlightedIndex, setHighlightedIndex] = useState(0)
  // Falls back to the first option when the list shrinks below the highlight.
  const activeIndex = highlightedIndex < options.length ? highlightedIndex : 0

  useEffect(() => {
    function handlePointerDown(event: MouseEvent): void {
      if (!containerRef.current?.contains(event.target as Node)) setIsOpen(false)
    }
    window.addEventListener('mousedown', handlePointerDown)
    return () => window.removeEventListener('mousedown', handlePointerDown)
  }, [])

  function handleKeyDown(event: KeyboardEvent<HTMLInputElement>): void {
    if (!isOpen) return
    if (event.key === 'Escape') {
      event.preventDefault()
      setIsOpen(false)
      return
    }
    if (options.length === 0) return
    if (event.key === 'ArrowDown') {
      event.preventDefault()
      setHighlightedIndex(Math.min(activeIndex + 1, options.length - 1))
    } else if (event.key === 'ArrowUp') {
      event.preventDefault()
      setHighlightedIndex(Math.max(activeIndex - 1, 0))
    } else if (event.key === 'Enter') {
      event.preventDefault()
      onSelect(options[activeIndex])
    }
  }

  return {
    containerRef,
    isOpen,
    setIsOpen,
    highlightedIndex: activeIndex,
    resetHighlight: () => setHighlightedIndex(0),
    handleKeyDown,
  }
}
