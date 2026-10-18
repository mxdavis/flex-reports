import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import ExportMenu from './ExportMenu'

function renderMenu(onSelect = vi.fn()) {
  render(<ExportMenu options={[{ id: 'csv', label: 'Download CSV', onSelect }]} />)
  return onSelect
}

describe('ExportMenu', () => {
  it('opens a menu of formats and focuses the first one', async () => {
    const user = userEvent.setup()
    renderMenu()

    const button = screen.getByRole('button', { name: 'Export' })
    expect(button).toHaveAttribute('aria-expanded', 'false')
    await user.click(button)

    expect(button).toHaveAttribute('aria-expanded', 'true')
    expect(screen.getByRole('menuitem', { name: 'Download CSV' })).toHaveFocus()
  })

  it('runs the chosen format, closes, and returns focus to the button', async () => {
    const user = userEvent.setup()
    const onSelect = renderMenu()

    await user.click(screen.getByRole('button', { name: 'Export' }))
    await user.click(screen.getByRole('menuitem', { name: 'Download CSV' }))

    expect(onSelect).toHaveBeenCalledTimes(1)
    expect(screen.queryByRole('menu')).toBeNull()
    expect(screen.getByRole('button', { name: 'Export' })).toHaveFocus()
  })

  it('closes on Escape', async () => {
    const user = userEvent.setup()
    renderMenu()

    await user.click(screen.getByRole('button', { name: 'Export' }))
    await user.keyboard('{Escape}')

    expect(screen.queryByRole('menu')).toBeNull()
  })
})
