import { useCombobox, type UseComboboxState, type UseComboboxStateChangeOptions } from 'downshift'
import { useMemo, useState } from 'react'
import { filterOptions } from '../hooks/useOptionsList'
import './Combobox.css'

type ComboboxProps = {
  // The input's id, so a <label htmlFor> names it.
  id: string
  // The picked option ('' for none). It changes only through onPick.
  value: string
  options: string[]
  onPick: (option: string) => void
  title?: string
}

const { InputBlur, InputChange, InputKeyDownEscape } = useCombobox.stateChangeTypes

// The option typed into the box, ignoring case. When options differ only by
// case, the exact spelling wins; if it's still unclear, nothing matches.
export function findTypedOption(typed: string, options: string[]): string | null {
  const text = typed.trim()
  if (!text) return null
  if (options.includes(text)) return text
  const matches = options.filter((option) => option.toLowerCase() === text.toLowerCase())
  return matches.length === 1 ? matches[0] : null
}

// Pick one option from a list. Typing only narrows the list: the value
// changes when an option is picked (click or Enter), or when the box is left
// holding an option's name. Otherwise leaving or Escape puts back the value.
export default function Combobox({ id, value, options, onPick, title }: ComboboxProps) {
  const allOptions = useMemo(
    () => Array.from(new Set(options)).sort((left, right) => left.localeCompare(right, undefined, { sensitivity: 'base' })),
    [options],
  )
  const [inputValue, setInputValue] = useState(value)
  // The list narrows only while the user types, so opening it shows every option.
  const [isTyping, setIsTyping] = useState(false)
  const items = useMemo(
    () => (isTyping ? filterOptions(allOptions, inputValue) : allOptions),
    [allOptions, inputValue, isTyping],
  )

  function stateReducer(
    state: UseComboboxState<string>,
    { type, changes }: UseComboboxStateChangeOptions<string>,
  ): Partial<UseComboboxState<string>> {
    if (type === InputBlur) {
      const typed = findTypedOption(state.inputValue, allOptions)
      return typed
        ? { ...changes, selectedItem: typed, inputValue: typed }
        : { ...changes, selectedItem: state.selectedItem, inputValue: state.selectedItem ?? '' }
    }
    if (type === InputKeyDownEscape) {
      return { ...changes, selectedItem: state.selectedItem, inputValue: state.selectedItem ?? '' }
    }
    return changes
  }

  const combobox = useCombobox<string>({
    items,
    inputId: id,
    selectedItem: value || null,
    inputValue,
    defaultHighlightedIndex: 0,
    itemToString: (item) => item ?? '',
    stateReducer,
    onInputValueChange: (changes) => setInputValue(changes.inputValue),
    onSelectedItemChange: ({ selectedItem }) => {
      if (selectedItem && selectedItem !== value) onPick(selectedItem)
    },
    onStateChange: ({ type, isOpen }) => {
      if (type === InputChange) setIsTyping(true)
      else if (isOpen !== undefined) setIsTyping(false)
    },
  })
  const { isOpen, highlightedIndex } = combobox

  return (
    <div className="fr-combobox">
      <div className="fr-combobox-row">
        {/* The page's <label htmlFor> names the input, not Downshift's label id. */}
        <input {...combobox.getInputProps({ title, autoComplete: 'off', 'aria-labelledby': undefined })} />
        <button
          type="button"
          className="fr-combobox-toggle"
          {...combobox.getToggleButtonProps({ title: 'Show options', 'aria-label': isOpen ? 'Hide options' : 'Show options' })}
        >
          v
        </button>
      </div>
      <ul
        className="fr-combobox-list"
        hidden={!isOpen || items.length === 0}
        {...combobox.getMenuProps({ 'aria-label': 'Suggestions', 'aria-labelledby': undefined })}
      >
        {isOpen && items.map((item, index) => (
          <li
            key={item}
            className={index === highlightedIndex ? 'fr-combobox-highlighted' : undefined}
            {...combobox.getItemProps({ item, index })}
          >
            {item}
          </li>
        ))}
      </ul>
    </div>
  )
}
