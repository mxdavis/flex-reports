import { fireEvent, render, screen, within } from '@testing-library/react'
import { useState } from 'react'
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
      .getAllByRole('option')
      .map((button) => button.textContent)

    expect(suggestions).toEqual(['alpha', 'bravo', 'zebra'])

    fireEvent.click(screen.getByRole('button', { name: 'bravo' }))
    expect(onChange).toHaveBeenCalledWith('bravo')
  })

  it('exposes meaningful toggle accessibility metadata', () => {
    render(
      <AutocompleteInput
        id="source"
        value=""
        options={['alpha']}
        onChange={() => undefined}
      />,
    )

    const toggle = screen.getByRole('button', { name: 'Show options' })
    expect(toggle).toHaveAttribute('aria-expanded', 'false')

    fireEvent.click(toggle)
    expect(screen.getByRole('button', { name: 'Hide options' })).toHaveAttribute('aria-expanded', 'true')
  })

  it('opens on every option with the filled-in value highlighted, and narrows only while typing', () => {
    function Picker() {
      const [value, setValue] = useState('client.id')
      return <AutocompleteInput id="source" value={value} options={['hours', 'client.id', 'client.name']} onChange={setValue} />
    }
    render(<Picker />)
    const input = screen.getByRole('textbox')
    const shownOptions = () => within(screen.getByRole('listbox', { name: 'Suggestions' })).getAllByRole('option')

    fireEvent.focus(input)
    expect(shownOptions().map((option) => option.textContent)).toEqual(['client.id', 'client.name', 'hours'])
    expect(shownOptions()[0]).toHaveAttribute('aria-selected', 'true')

    fireEvent.change(input, { target: { value: 'na' } })
    expect(shownOptions().map((option) => option.textContent)).toEqual(['client.name'])

    fireEvent.click(screen.getByRole('button', { name: 'client.name' }))
    fireEvent.click(screen.getByRole('button', { name: 'Show options' }))
    expect(shownOptions()).toHaveLength(3)
    expect(shownOptions()[1]).toHaveAttribute('aria-selected', 'true')
  })
})
