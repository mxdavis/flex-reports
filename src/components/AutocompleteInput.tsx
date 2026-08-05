import { useEffect, useMemo, useRef, useState } from 'react'

type AutocompleteInputProps = {
  id: string
  value: string
  options: string[]
  onChange: (nextValue: string) => void
  placeholder?: string
  title?: string
  query?: string
  disabled?: boolean
  onSelectOption?: (option: string, currentValue: string) => string
}

function normalize(value: string): string {
  return value.trim().toLowerCase()
}

export default function AutocompleteInput({
  id,
  value,
  options,
  onChange,
  placeholder,
  title,
  query,
  disabled,
  onSelectOption,
}: AutocompleteInputProps) {
  const containerRef = useRef<HTMLDivElement | null>(null)
  const [isOpen, setIsOpen] = useState(false)
  const [highlightedIndex, setHighlightedIndex] = useState(0)

  const activeQuery = query ?? value
  const filteredOptions = useMemo(() => {
    const normalizedQuery = normalize(activeQuery)
    const unique = Array.from(new Set(options))

    if (!normalizedQuery) {
      return unique
    }

    return unique.filter((option) => normalize(option).includes(normalizedQuery))
  }, [activeQuery, options])

  useEffect(() => {
    function handlePointerDown(event: MouseEvent): void {
      if (!containerRef.current?.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    window.addEventListener('mousedown', handlePointerDown)
    return () => {
      window.removeEventListener('mousedown', handlePointerDown)
    }
  }, [])

  useEffect(() => {
    if (highlightedIndex >= filteredOptions.length) {
      setHighlightedIndex(0)
    }
  }, [filteredOptions.length, highlightedIndex])

  function selectOption(option: string): void {
    const nextValue = onSelectOption ? onSelectOption(option, value) : option
    onChange(nextValue)
    setIsOpen(false)
  }

  return (
    <div className="autocomplete" ref={containerRef}>
      <div className="autocomplete-row">
        <input
          id={id}
          type="text"
          value={value}
          placeholder={placeholder}
          title={title}
          disabled={disabled}
          autoComplete="off"
          onFocus={() => {
            setIsOpen(true)
          }}
          onChange={(event) => {
            onChange(event.target.value)
            setIsOpen(true)
            setHighlightedIndex(0)
          }}
          onKeyDown={(event) => {
            if (!isOpen) {
              if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
                event.preventDefault()
                setIsOpen(true)
              }
              return
            }

            if (event.key === 'ArrowDown') {
              event.preventDefault()
              setHighlightedIndex((previous) => {
                if (filteredOptions.length === 0) {
                  return 0
                }
                return Math.min(previous + 1, filteredOptions.length - 1)
              })
            }

            if (event.key === 'ArrowUp') {
              event.preventDefault()
              setHighlightedIndex((previous) => Math.max(previous - 1, 0))
            }

            if (event.key === 'Enter' && filteredOptions.length > 0) {
              event.preventDefault()
              selectOption(filteredOptions[highlightedIndex] ?? filteredOptions[0])
            }

            if (event.key === 'Escape') {
              setIsOpen(false)
            }
          }}
        />
        <button
          type="button"
          className="autocomplete-toggle"
          title="Show options"
          disabled={disabled}
          onClick={() => {
            setIsOpen((previous) => !previous)
          }}
        >
          v
        </button>
      </div>

      {isOpen && filteredOptions.length > 0 && (
        <ul className="autocomplete-list" role="listbox" aria-label="Suggestions">
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
