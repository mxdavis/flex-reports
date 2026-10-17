import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import EditModeToolbar from './EditModeToolbar'

describe('EditModeToolbar', () => {
  it('renders toggle button and calls onToggle', () => {
    const onToggle = vi.fn()
    render(
      <EditModeToolbar
        isEditMode={false}
        onToggle={onToggle}
      />,
    )

    fireEvent.click(screen.getByRole('button', { name: 'Edit mode' }))
    expect(onToggle).toHaveBeenCalledTimes(1)
  })

  it('renders edit-mode jump buttons and forwards selected target', () => {
    const onJumpToSection = vi.fn()
    render(
      <EditModeToolbar
        isEditMode
        onToggle={() => undefined}
        jumpTargets={[
          { id: 'fr-report-columns', label: 'Columns' },
          { id: 'fr-report-formulas', label: 'Formulas' },
          { id: 'fr-report-table', label: 'Table' },
        ]}
        onJumpToSection={onJumpToSection}
      />,
    )

    fireEvent.click(screen.getByRole('button', { name: 'Formulas' }))
    expect(onJumpToSection).toHaveBeenCalledWith('fr-report-formulas')
  })

  it('hides Save when the user cannot save', () => {
    render(<EditModeToolbar isEditMode onToggle={() => undefined} />)

    expect(screen.queryByRole('button', { name: 'Save report' })).not.toBeInTheDocument()
  })

  it('enables Save only when there are unsaved changes', () => {
    const onSave = vi.fn()
    const { rerender } = render(
      <EditModeToolbar isEditMode={false} onToggle={() => undefined} canSave onSave={onSave} />,
    )
    expect(screen.getByRole('button', { name: 'Save report' })).toBeDisabled()

    rerender(<EditModeToolbar isEditMode={false} onToggle={() => undefined} canSave isDirty onSave={onSave} />)
    fireEvent.click(screen.getByRole('button', { name: 'Save report' }))
    expect(onSave).toHaveBeenCalledTimes(1)
  })

  it('shows saving state and save errors', () => {
    render(
      <EditModeToolbar isEditMode onToggle={() => undefined} canSave isDirty isSaving saveError="Not allowed" />,
    )

    expect(screen.getByRole('button', { name: 'Saving…' })).toBeDisabled()
    expect(screen.getByRole('alert')).toHaveTextContent('Not allowed')
  })

  it('explains why Save isn't offered', () => {
    render(<EditModeToolbar isEditMode onToggle={() => undefined} saveBlockedReason="Saving is turned off here." />)

    expect(screen.queryByRole('button', { name: 'Save report' })).toBeNull()
    expect(screen.getByRole('note')).toHaveTextContent('Saving is turned off here.')
  })
})
