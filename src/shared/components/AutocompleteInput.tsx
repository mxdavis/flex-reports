import { useMemo, useState } from 'react'
import { filterOptions, useOptionsList } from '../hooks/useOptionsList'
import AutocompleteOptionsList from './AutocompleteOptionsList'
import './AutocompleteInput.css'

type AutocompleteInputProps = {
  id: string
  value: string
  options: string[]
  onChange: (nextValue: string) => void
  title?: string
}

export default function AutocompleteInput({ id, value, options, onChange, title }: AutocompleteInputProps) {
  const allOptions = useMemo(
    () => filterOptions([...options].sort((left, right) => left.localeCompare(right, undefined, { sensitivity: 'base' })), ''),
    [options],
  )
  // The list narrows only to what the user is typing. A value that was filled
  // in (or picked earlier) shows every option, so it never looks like the only choice.
  const [isTyping, setIsTyping] = useState(false)
  const filteredOptions = useMemo(
    () => (isTyping ? filterOptions(allOptions, value) : allOptions),
    [allOptions, isTyping, value],
  )

  function choose(option: string): void {
    onChange(option)
    setIsTyping(false)
    list.setIsOpen(false)
  }

  const list = useOptionsList(filteredOptions, choose)

  // Opens on the whole list, with the current value highlighted.
  function open(): void {
    setIsTyping(false)
    list.highlight(Math.max(0, allOptions.indexOf(value)))
    list.setIsOpen(true)
  }

  return (
    <div className="fr-autocomplete" ref={list.containerRef}>
      <div className="fr-autocomplete-row">
        <input
          id={id}
          type="text"
          value={value}
          title={title}
          autoComplete="off"
          onFocus={open}
          onChange={(event) => {
            onChange(event.target.value)
            setIsTyping(true)
            list.setIsOpen(true)
            list.resetHighlight()
          }}
          onKeyDown={(event) => {
            // Arrow keys open a closed list; otherwise the list handles keys.
            if (!list.isOpen && (event.key === 'ArrowDown' || event.key === 'ArrowUp')) {
              event.preventDefault()
              open()
              return
            }
            list.handleKeyDown(event)
          }}
        />
        <button
          type="button"
          className="fr-autocomplete-toggle"
          title="Show options"
          aria-label={list.isOpen ? 'Hide options' : 'Show options'}
          aria-expanded={list.isOpen}
          onClick={() => (list.isOpen ? list.setIsOpen(false) : open())}
        >
          v
        </button>
      </div>

      {list.isOpen && filteredOptions.length > 0 && (
        <AutocompleteOptionsList
          options={filteredOptions}
          highlightedIndex={list.highlightedIndex}
          ariaLabel="Suggestions"
          onSelect={choose}
        />
      )}
    </div>
  )
}
