import { useEffect, useMemo, useRef, useState } from 'react'

type TokenizedExpressionInputProps = {
  id: string
  value: string
  options: string[]
  onChange: (nextValue: string) => void
  placeholder?: string
  title?: string
}

type TriggerState = {
  start: number
  query: string
}

function normalize(value: string): string {
  return value.trim().toLowerCase()
}

function getTriggerState(value: string, cursor: number): TriggerState | null {
  const cappedCursor = Math.max(0, Math.min(cursor, value.length))
  const prefix = value.slice(0, cappedCursor)
  const openIndex = prefix.lastIndexOf('{{')
  const closeIndex = prefix.lastIndexOf('}}')

  if (openIndex === -1 || openIndex < closeIndex) {
    return null
  }

  const query = prefix.slice(openIndex + 2)
  if (query.includes('{') || query.includes('}')) {
    return null
  }

  return {
    start: openIndex,
    query,
  }
}

export default function TokenizedExpressionInput({
  id,
  value,
  options,
  onChange,
  placeholder,
  title,
}: TokenizedExpressionInputProps) {
  const inputRef = useRef<HTMLInputElement | null>(null)
  const wrapperRef = useRef<HTMLDivElement | null>(null)
  const pendingCursorRef = useRef<number | null>(null)

  const [isOpen, setIsOpen] = useState(false)
  const [cursorPosition, setCursorPosition] = useState(value.length)
  const [highlightedIndex, setHighlightedIndex] = useState(0)

  const triggerState = useMemo(() => {
    return getTriggerState(value, cursorPosition)
  }, [cursorPosition, value])

  const filteredOptions = useMemo(() => {
    if (!triggerState) {
      return []
    }

    const normalizedQuery = normalize(triggerState.query)
    const uniqueOptions = Array.from(new Set(options))

    if (!normalizedQuery) {
      return uniqueOptions
    }

    return uniqueOptions.filter((option) => normalize(option).includes(normalizedQuery))
  }, [options, triggerState])

  useEffect(() => {
    if (!triggerState) {
      setIsOpen(false)
      return
    }

    setIsOpen(true)
  }, [triggerState])

  useEffect(() => {
    if (highlightedIndex >= filteredOptions.length) {
      setHighlightedIndex(0)
    }
  }, [filteredOptions.length, highlightedIndex])

  useEffect(() => {
    function handlePointerDown(event: MouseEvent): void {
      if (!wrapperRef.current?.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    window.addEventListener('mousedown', handlePointerDown)
    return () => {
      window.removeEventListener('mousedown', handlePointerDown)
    }
  }, [])

  useEffect(() => {
    if (pendingCursorRef.current === null || !inputRef.current) {
      return
    }

    const cursor = pendingCursorRef.current
    inputRef.current.focus()
    inputRef.current.setSelectionRange(cursor, cursor)
    pendingCursorRef.current = null
  }, [value])

  function selectOption(option: string): void {
    if (!triggerState) {
      return
    }

    const cursor = inputRef.current?.selectionStart ?? cursorPosition
    const beforeToken = value.slice(0, triggerState.start)
    const afterToken = value.slice(cursor)
    const nextValue = `${beforeToken}{{${option}}}${afterToken}`
    const nextCursor = beforeToken.length + option.length + 4

    pendingCursorRef.current = nextCursor
    onChange(nextValue)
    setCursorPosition(nextCursor)
    setIsOpen(false)
  }

  const shouldShowList = isOpen && triggerState && filteredOptions.length > 0

  return (
    <div className="tokenized-expression" ref={wrapperRef}>
      <input
        id={id}
        ref={inputRef}
        type="text"
        value={value}
        placeholder={placeholder}
        title={title}
        autoComplete="off"
        onChange={(event) => {
          const nextValue = event.target.value
          const nextCursor = event.target.selectionStart ?? nextValue.length
          onChange(nextValue)
          setCursorPosition(nextCursor)
        }}
        onClick={(event) => {
          setCursorPosition((event.currentTarget as HTMLInputElement).selectionStart ?? value.length)
        }}
        onKeyUp={(event) => {
          setCursorPosition((event.currentTarget as HTMLInputElement).selectionStart ?? value.length)
        }}
        onKeyDown={(event) => {
          if (!shouldShowList) {
            return
          }

          if (event.key === 'ArrowDown') {
            event.preventDefault()
            setHighlightedIndex((previous) => Math.min(previous + 1, filteredOptions.length - 1))
            return
          }

          if (event.key === 'ArrowUp') {
            event.preventDefault()
            setHighlightedIndex((previous) => Math.max(previous - 1, 0))
            return
          }

          if (event.key === 'Enter') {
            event.preventDefault()
            selectOption(filteredOptions[highlightedIndex] ?? filteredOptions[0])
            return
          }

          if (event.key === 'Escape') {
            event.preventDefault()
            setIsOpen(false)
          }
        }}
      />

      {shouldShowList && (
        <ul className="autocomplete-list" role="listbox" aria-label="Formula token suggestions">
          {filteredOptions.map((option, index) => (
            <li key={option}>
              <button
                type="button"
                className={index === highlightedIndex ? 'highlighted' : ''}
                onMouseDown={(event) => {
                  event.preventDefault()
                }}
                onClick={() => {
                  selectOption(option)
                }}
              >
                {option}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
