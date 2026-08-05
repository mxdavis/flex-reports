import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import EditModeToolbar from './EditModeToolbar'

describe('EditModeToolbar', () => {
  it('renders toggle button and calls onToggle', () => {
    const onToggle = vi.fn()
    render(
      <EditModeToolbar
        canEditReport
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
        canEditReport
        isEditMode
        onToggle={() => undefined}
        jumpTargets={[
          { id: 'report-columns', label: 'Columns' },
          { id: 'report-formulas', label: 'Formulas' },
          { id: 'report-chart', label: 'Chart' },
        ]}
        onJumpToSection={onJumpToSection}
      />,
    )

    fireEvent.click(screen.getByRole('button', { name: 'Formulas' }))
    expect(onJumpToSection).toHaveBeenCalledWith('report-formulas')
  })
})
