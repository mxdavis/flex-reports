import { useEffect, useMemo, useRef, useState } from 'react'
import './TokenizedExpressionInput.css'
import { filterTokenOptions, getTriggerState } from './tokenizedExpressionUtils'
import AutocompleteOptionsList from './AutocompleteOptionsList'

type TokenizedExpressionInputProps = {
  id: string
  value: string
  options: string[]
  onChange: (nextValue: string) => void
  placeholder?: string
  title?: string
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

    return filterTokenOptions(options, triggerState.query)
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
        <AutocompleteOptionsList
          options={filteredOptions}
          highlightedIndex={highlightedIndex}
          ariaLabel="Formula token suggestions"
          onSelect={selectOption}
        />
      )}
    </div>
  )
}
