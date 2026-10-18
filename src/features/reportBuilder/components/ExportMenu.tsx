import { useEffect, useRef, useState } from 'react'
import './ExportMenu.css'

export type ExportOption = {
  id: string
  label: string
  onSelect: () => void
}

type ExportMenuProps = {
  options: ExportOption[]
}

// The table's Export button and its menu of formats.
function ExportMenu({ options }: ExportMenuProps) {
  const [isOpen, setIsOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement | null>(null)
  const buttonRef = useRef<HTMLButtonElement | null>(null)
  const menuRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    if (!isOpen) return
    menuRef.current?.querySelector<HTMLButtonElement>('[role="menuitem"]')?.focus()
    function handlePointerDown(event: MouseEvent): void {
      if (!containerRef.current?.contains(event.target as Node)) setIsOpen(false)
    }
    window.addEventListener('mousedown', handlePointerDown)
    return () => window.removeEventListener('mousedown', handlePointerDown)
  }, [isOpen])

  function close(): void {
    setIsOpen(false)
    buttonRef.current?.focus()
  }

  return (
    <div className="fr-export-menu" ref={containerRef}>
      <button
        ref={buttonRef}
        type="button"
        aria-haspopup="menu"
        aria-expanded={isOpen}
        onClick={() => setIsOpen(!isOpen)}
        title="Print or download this report."
      >
        Export
      </button>
      {isOpen && (
        <div
          ref={menuRef}
          className="fr-export-menu-list"
          role="menu"
          aria-label="Export"
          onKeyDown={(event) => {
            if (event.key === 'Escape') close()
          }}
        >
          {options.map((option) => (
            <button
              key={option.id}
              type="button"
              role="menuitem"
              onClick={() => {
                close()
                option.onSelect()
              }}
            >
              {option.label}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

export default ExportMenu
