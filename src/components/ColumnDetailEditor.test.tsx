import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import ColumnDetailEditor from './ColumnDetailEditor'

describe('ColumnDetailEditor', () => {
  it('calls callbacks when editing source, label, and display type', () => {
    const onSourceChange = vi.fn()
    const onLabelChange = vi.fn()
    const onDisplayTypeChange = vi.fn()

    render(
      <ColumnDetailEditor
        field={{ id: 'field-1', sourceKey: 'workDate', label: 'Date', displayType: 'date' }}
        columnLabel="COLUMN 1"
        sourceOptions={['workDate', 'hours']}
        displayTypeOptions={[
          { value: 'date', label: 'Date' },
          { value: 'decimal', label: 'Decimal' },
        ]}
        onSourceChange={onSourceChange}
        onLabelChange={onLabelChange}
        onDisplayTypeChange={onDisplayTypeChange}
      />,
    )

    fireEvent.change(screen.getByLabelText('COLUMN 1'), { target: { value: 'hours' } })
    expect(onSourceChange).toHaveBeenCalledWith('hours')

    fireEvent.change(screen.getByLabelText('Display label'), { target: { value: 'Hours' } })
    expect(onLabelChange).toHaveBeenCalledWith('Hours')

    fireEvent.change(screen.getByLabelText('Display type'), { target: { value: 'decimal' } })
    expect(onDisplayTypeChange).toHaveBeenCalledWith('decimal')
  })
})
