import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import AutocompleteOptionsList from './AutocompleteOptionsList'

describe('AutocompleteOptionsList', () => {
  it('renders options and triggers selection', () => {
    const onSelect = vi.fn()

    render(
      <AutocompleteOptionsList
        options={['hours', 'rate']}
        highlightedIndex={1}
        ariaLabel="Suggestions"
        onSelect={onSelect}
      />,
    )

    expect(screen.getByRole('listbox', { name: 'Suggestions' })).toBeInTheDocument()
    const rateOption = screen.getByRole('option', { name: 'rate' })
    const rateButton = screen.getByRole('button', { name: 'rate' })
    expect(rateOption).toHaveAttribute('aria-selected', 'true')
    expect(rateButton).toHaveClass('highlighted')

    fireEvent.click(rateButton)
    expect(onSelect).toHaveBeenCalledWith('rate')
  })
})
