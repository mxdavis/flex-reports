import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import ConfirmDialog from './ConfirmDialog'

function renderDialog(isOpen = true) {
  const onConfirm = vi.fn()
  const onCancel = vi.fn()
  render(
    <ConfirmDialog
      isOpen={isOpen}
      title="Delete this?"
      message="You can't undo this."
      confirmLabel="Delete"
      isDestructive
      onConfirm={onConfirm}
      onCancel={onCancel}
    />,
  )
  return { onConfirm, onCancel }
}

describe('ConfirmDialog', () => {
  it('shows nothing while closed', () => {
    renderDialog(false)
    expect(screen.queryByRole('dialog')).toBeNull()
  })

  it('opens as a modal named by its title and described by its message', () => {
    renderDialog()
    const dialog = screen.getByRole('dialog', { name: 'Delete this?' })
    expect(dialog).toHaveAttribute('open')
    expect(dialog).toHaveAccessibleDescription("You can't undo this.")
  })

  it('confirms or cancels with its buttons', () => {
    const { onConfirm, onCancel } = renderDialog()
    fireEvent.click(screen.getByRole('button', { name: 'Delete' }))
    expect(onConfirm).toHaveBeenCalledTimes(1)
    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }))
    expect(onCancel).toHaveBeenCalledTimes(1)
  })

  it('can name its cancel button', () => {
    render(<ConfirmDialog isOpen title="Switch?" message="Unsaved." confirmLabel="Save" cancelLabel="Keep editing" onConfirm={vi.fn()} onCancel={vi.fn()} />)
    expect(screen.getByRole('button', { name: 'Keep editing' })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Cancel' })).toBeNull()
  })

  it('cancels on Escape, leaving the parent to close it', () => {
    const { onCancel } = renderDialog()
    const dialog = screen.getByRole('dialog')
    const escape = new Event('cancel', { cancelable: true })
    dialog.dispatchEvent(escape)
    expect(onCancel).toHaveBeenCalledTimes(1)
    expect(escape.defaultPrevented).toBe(true)
  })
})
