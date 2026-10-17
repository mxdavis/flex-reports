import { useEffect, useMemo, useRef, useState } from 'react'
import { filterOptions, useOptionsList } from '../hooks/useOptionsList'
import './TokenizedExpressionInput.css'
import { getTriggerState } from './tokenizedExpressionUtils'
import AutocompleteOptionsList from './AutocompleteOptionsList'

type TokenizedExpressionInputProps = {
  id: string
  value: string
  options: string[]
  onChange: (nextValue: string) => void
  title?: string
}

export default function TokenizedExpressionInput({
  id,
  value,
  options,
  onChange,
  title,
}: TokenizedExpressionInputProps) {
  const inputRef = useRef<HTMLInputElement | null>(null)
  const pendingCursorRef = useRef<number | null>(null)

  const [cursorPosition, setCursorPosition] = useState(value.length)

  const triggerState = useMemo(() => {
    return getTriggerState(value, cursorPosition)
  }, [cursorPosition, value])

  const filteredOptions = useMemo(() => {
    if (!triggerState) {
      return []
    }

    return filterOptions(options, triggerState.query)
  }, [options, triggerState])

  const list = useOptionsList(filteredOptions, selectOption)
  const { setIsOpen } = list

  // The list opens while the cursor is inside a {{ token and closes outside it.
  useEffect(() => {
    setIsOpen(triggerState !== null)
  }, [setIsOpen, triggerState])

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
    list.setIsOpen(false)
  }

  const shouldShowList = list.isOpen && triggerState && filteredOptions.length > 0

  return (
    <div className="fr-tokenized-expression" ref={list.containerRef}>
      <input
        id={id}
        ref={inputRef}
        type="text"
        value={value}
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
        onKeyDown={list.handleKeyDown}
      />

      {shouldShowList && (
        <AutocompleteOptionsList
          options={filteredOptions}
          highlightedIndex={list.highlightedIndex}
          ariaLabel="Formula token suggestions"
          onSelect={selectOption}
        />
      )}
    </div>
  )
}
