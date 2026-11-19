import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useState } from 'react'
import { describe, expect, it, vi } from 'vitest'
import Combobox from './Combobox'

const options = ['hours', 'client.id', 'client.name']

function Picker({ initial = 'client.id', choices = options, onPick = vi.fn() }: { initial?: string, choices?: string[], onPick?: (option: string) => void }) {
  const [value, setValue] = useState(initial)
  return (
    <>
      <label htmlFor="field">Field</label>
      <Combobox id="field" value={value} options={choices} onPick={(option) => { onPick(option); setValue(option) }} />
      <button type="button">Elsewhere</button>
    </>
  )
}

const input = () => screen.getByRole('combobox', { name: 'Field' })
const shownOptions = () => within(screen.getByRole('listbox', { name: 'Suggestions' })).queryAllByRole('option')

describe('Combobox', () => {
  it('is a combobox named by its label, and opens on every option with the current one highlighted', async () => {
    const user = userEvent.setup()
    render(<Picker />)
    expect(input()).toHaveAttribute('aria-expanded', 'false')

    await user.click(input())

    expect(input()).toHaveAttribute('aria-expanded', 'true')
    expect(shownOptions().map((option) => option.textContent)).toEqual(['client.id', 'client.name', 'hours'])
    expect(shownOptions()[0]).toHaveAttribute('aria-selected', 'true')
  })

  it('narrows the list while typing, ignoring case, without changing the value', async () => {
    const user = userEvent.setup()
    const onPick = vi.fn()
    render(<Picker onPick={onPick} />)

    await user.click(input())
    await user.type(input(), '{Control>}a{/Control}NA')

    expect(shownOptions().map((option) => option.textContent)).toEqual(['client.name'])
    expect(onPick).not.toHaveBeenCalled()
  })

  it('picks an option by click or by Enter on the highlighted one', async () => {
    const user = userEvent.setup()
    const onPick = vi.fn()
    render(<Picker onPick={onPick} />)

    await user.click(input())
    await user.click(screen.getByRole('option', { name: 'hours' }))
    expect(onPick).toHaveBeenLastCalledWith('hours')
    expect(input()).toHaveValue('hours')

    await user.clear(input())
    await user.type(input(), 'name{Enter}')
    expect(onPick).toHaveBeenLastCalledWith('client.name')
    expect(input()).toHaveValue('client.name')
  })

  it('picks the exact typed name on Enter, even when other options contain it', async () => {
    const user = userEvent.setup()
    const onPick = vi.fn()
    render(<Picker initial="hours" choices={['client.id', 'id', 'person.id', 'hours']} onPick={onPick} />)

    await user.clear(input())
    await user.type(input(), 'ID{Enter}')

    expect(onPick).toHaveBeenCalledWith('id')
    expect(input()).toHaveValue('id')
  })

  it('says when nothing matches, without claiming the list is open', async () => {
    const user = userEvent.setup()
    render(<Picker />)

    await user.clear(input())
    await user.type(input(), 'zzz')

    expect(screen.getByRole('status')).toHaveTextContent('No matches')
    expect(input()).toHaveAttribute('aria-expanded', 'false')
    expect(screen.getByRole('button', { name: 'Hide options' })).toHaveAttribute('aria-expanded', 'false')

    await user.clear(input())
    expect(screen.getByRole('status')).toBeEmptyDOMElement()
  })

  it('picks a typed name on leaving, ignoring case, and shows its real spelling', async () => {
    const user = userEvent.setup()
    const onPick = vi.fn()
    render(<Picker onPick={onPick} />)

    await user.clear(input())
    await user.type(input(), 'HOURS')
    await user.click(screen.getByRole('button', { name: 'Elsewhere' }))

    expect(onPick).toHaveBeenCalledWith('hours')
    expect(input()).toHaveValue('hours')
  })

  it('puts back the value when leaving with a partial name, or on Escape', async () => {
    const user = userEvent.setup()
    const onPick = vi.fn()
    render(<Picker onPick={onPick} />)

    await user.clear(input())
    await user.type(input(), 'hou')
    await user.tab()
    expect(input()).toHaveValue('client.id')

    await user.clear(input())
    await user.type(input(), 'hou{Escape}{Escape}')
    expect(input()).toHaveValue('client.id')
    expect(onPick).not.toHaveBeenCalled()
  })

  it('takes a later value from outside', () => {
    const { rerender } = render(<Combobox id="field" value="hours" options={options} onPick={vi.fn()} />)
    rerender(<Combobox id="field" value="client.name" options={options} onPick={vi.fn()} />)
    expect(screen.getByRole('combobox')).toHaveValue('client.name')
  })
})
