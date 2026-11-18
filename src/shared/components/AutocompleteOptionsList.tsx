import { useEffect, useRef } from 'react'
import './AutocompleteOptionsList.css'

type AutocompleteOptionsListProps = {
  options: string[]
  highlightedIndex: number
  ariaLabel: string
  onSelect: (option: string) => void
}

function AutocompleteOptionsList({
  options,
  highlightedIndex,
  ariaLabel,
  onSelect,
}: AutocompleteOptionsListProps) {
  const listRef = useRef<HTMLUListElement | null>(null)

  // The list is short and scrolls, so keep the highlighted option in view
  // (it can start partway down, on the current value).
  useEffect(() => {
    const highlighted = listRef.current?.children[highlightedIndex]
    // jsdom has no scrollIntoView.
    highlighted?.scrollIntoView?.({ block: 'nearest' })
  }, [highlightedIndex, options])

  return (
    <ul ref={listRef} className="fr-autocomplete-list" role="listbox" aria-label={ariaLabel}>
      {options.map((option, index) => (
        <li key={option} role="option" aria-selected={index === highlightedIndex}>
          <button
            type="button"
            className={index === highlightedIndex ? 'fr-highlighted' : undefined}
            onMouseDown={(event) => {
              event.preventDefault()
            }}
            onClick={() => {
              onSelect(option)
            }}
          >
            {option}
          </button>
        </li>
      ))}
    </ul>
  )
}

export default AutocompleteOptionsList
