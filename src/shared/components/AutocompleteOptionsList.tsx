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
  return (
    <ul className="autocomplete-list" role="listbox" aria-label={ariaLabel}>
      {options.map((option, index) => (
        <li key={option}>
          <button
            type="button"
            role="option"
            aria-selected={index === highlightedIndex}
            className={index === highlightedIndex ? 'highlighted' : ''}
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
