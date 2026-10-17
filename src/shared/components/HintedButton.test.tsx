import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import HintedButton from './HintedButton'

describe('HintedButton', () => {
  it('works as a toggle with its own tooltip when enabled', () => {
    const onClick = vi.fn()
    render(<HintedButton onClick={onClick} title="Show totals." isPressed>Totals</HintedButton>)

    const button = screen.getByRole('button', { name: 'Totals' })
    expect(button).toHaveAttribute('aria-pressed', 'true')
    expect(button).toHaveAttribute('title', 'Show totals.')
    fireEvent.click(button)
    expect(onClick).toHaveBeenCalled()
  })

  it('disables the button and explains why on its wrapper', () => {
    render(<HintedButton onClick={() => undefined} title="Show totals." disabledReason="Not in vertical view.">Totals</HintedButton>)

    const button = screen.getByRole('button', { name: 'Totals' })
    expect(button).toBeDisabled()
    expect(button).not.toHaveAttribute('title')
    expect(button.closest('.fr-hinted-button')).toHaveAttribute('title', 'Not in vertical view.')
  })
})
