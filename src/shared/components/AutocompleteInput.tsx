import { useMemo } from 'react'
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
  const sortedOptions = useMemo(
    () => [...options].sort((left, right) => left.localeCompare(right, undefined, { sensitivity: 'base' })),
    [options],
  )
  const filteredOptions = useMemo(() => filterOptions(sortedOptions, value), [sortedOptions, value])

  const list = useOptionsList(filteredOptions, (option) => {
    onChange(option)
    list.setIsOpen(false)
  })

  return (
    <div className="fr-autocomplete" ref={list.containerRef}>
      <div className="fr-autocomplete-row">
        <input
          id={id}
          type="text"
          value={value}
          title={title}
          autoComplete="off"
          onFocus={() => list.setIsOpen(true)}
          onChange={(event) => {
            onChange(event.target.value)
            list.setIsOpen(true)
            list.resetHighlight()
          }}
          onKeyDown={(event) => {
            // Arrow keys open a closed list; otherwise the list handles keys.
            if (!list.isOpen && (event.key === 'ArrowDown' || event.key === 'ArrowUp')) {
              event.preventDefault()
              list.setIsOpen(true)
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
          onClick={() => list.setIsOpen(!list.isOpen)}
        >
          v
        </button>
      </div>

      {list.isOpen && filteredOptions.length > 0 && (
        <AutocompleteOptionsList
          options={filteredOptions}
          highlightedIndex={list.highlightedIndex}
          ariaLabel="Suggestions"
          onSelect={(option) => {
            onChange(option)
            list.setIsOpen(false)
          }}
        />
      )}
    </div>
  )
}
