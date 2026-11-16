import type { ReactNode } from 'react'
import './HintedButton.css'

type HintedButtonProps = {
  children: ReactNode
  onClick: () => void
  // Shown on hover, and as the button's tooltip.
  title?: string
  // When set, the button is disabled and this explains why on hover.
  disabledReason?: string
  // For toggles: whether the option is on.
  isPressed?: boolean
}

// A toolbar button that can be disabled with an explanation. A disabled button
// can't show a tooltip itself, so the reason sits on a wrapper.
function HintedButton({ children, onClick, title, disabledReason, isPressed }: HintedButtonProps) {
  return (
    <span className="fr-hinted-button" title={disabledReason}>
      <button
        type="button"
        aria-pressed={isPressed}
        disabled={disabledReason !== undefined}
        onClick={onClick}
        title={disabledReason === undefined ? title : undefined}
      >
        {children}
      </button>
    </span>
  )
}

export default HintedButton
