import { useCombobox, type UseComboboxState, type UseComboboxStateChangeOptions } from 'downshift'
import { useMemo, useState } from 'react'
import { filterOptions, findTypedOption } from '../utils/optionMatching'
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
    // Leaving never picks the highlighted option (handleBlur picks a typed
    // name), and Escape never clears the value.
    if (type === InputBlur) {
      const typed = findTypedOption(state.inputValue, allOptions)
      return { ...changes, selectedItem: state.selectedItem, inputValue: typed ?? state.selectedItem ?? '' }
    }
    if (type === InputKeyDownEscape) {
      return { ...changes, selectedItem: state.selectedItem, inputValue: state.selectedItem ?? '' }
    }
    // Highlight an exactly typed name, so Enter picks it rather than the first
    // option that merely contains it ("id" over "client.id").
    if (type === InputChange) {
      const typedText = changes.inputValue ?? ''
      const typed = findTypedOption(typedText, allOptions)
      if (typed) return { ...changes, highlightedIndex: filterOptions(allOptions, typedText).indexOf(typed) }
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
  const hasNoMatches = isOpen && items.length === 0
  const isListShown = isOpen && !hasNoMatches

  // Picks a typed name as the box loses focus. That happens on mouse-down, so
  // a click on Save right after typing saves the new field: Downshift's own
  // change callbacks run in a later effect, after that click.
  function handleBlur(): void {
    const typed = findTypedOption(inputValue, allOptions)
    if (typed && typed !== value) onPick(typed)
    setInputValue(typed ?? value)
  }

  return (
    <div className="fr-combobox">
      <div className="fr-combobox-row">
        {/* The page's <label htmlFor> names the input, not Downshift's label id. */}
        <input
          {...combobox.getInputProps({
            title,
            autoComplete: 'off',
            'aria-labelledby': undefined,
            'aria-expanded': isListShown,
            onBlur: handleBlur,
          })}
        />
        <button
          type="button"
          className="fr-combobox-toggle"
          {...combobox.getToggleButtonProps({
            title: 'Show options',
            'aria-label': isOpen ? 'Hide options' : 'Show options',
            'aria-expanded': isListShown,
          })}
        >
          v
        </button>
      </div>
      <ul
        className="fr-combobox-list"
        hidden={!isListShown}
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
      <p className="fr-combobox-empty" role="status">{hasNoMatches ? 'No matches' : ''}</p>
    </div>
  )
}
