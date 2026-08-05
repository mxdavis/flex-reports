import { fireEvent, render, screen, within } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import AutocompleteInput from './AutocompleteInput'

describe('AutocompleteInput', () => {
  it('shows options in alphabetical order and selects an option', () => {
    const onChange = vi.fn()
    render(
      <AutocompleteInput
        id="source"
        value=""
        options={['zebra', 'alpha', 'bravo']}
        onChange={onChange}
      />,
    )

    fireEvent.click(screen.getByTitle('Show options'))

    const suggestions = within(screen.getByRole('listbox', { name: 'Suggestions' }))
      .getAllByRole('button')
      .map((button) => button.textContent)

    expect(suggestions).toEqual(['alpha', 'bravo', 'zebra'])

    fireEvent.click(screen.getByRole('button', { name: 'bravo' }))
    expect(onChange).toHaveBeenCalledWith('bravo')
  })
})
