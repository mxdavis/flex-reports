import { fireEvent, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { pickField } from '../test/pickField'
import ColumnDetailEditor from './ColumnDetailEditor'

describe('ColumnDetailEditor', () => {
  it('calls callbacks when picking a field and editing label, display type and total', async () => {
    const user = userEvent.setup()
    const onSourceChange = vi.fn()
    const onLabelChange = vi.fn()
    const onDisplayTypeChange = vi.fn()
    const onAggregationChange = vi.fn()

    render(
      <ColumnDetailEditor
        field={{
          id: 'field-1',
          sourceKey: 'workDate',
          label: 'Date',
          displayType: 'date',
          aggregation: 'count',
        }}
        columnName="COLUMN 1"
        sourceOptions={['workDate', 'hours']}
        displayTypeOptions={[
          { value: 'date', label: 'Date' },
          { value: 'decimal', label: 'Decimal' },
        ]}
        aggregationOptions={[
          { value: 'none', label: 'None' },
          { value: 'sum', label: 'Sum' },
          { value: 'avg', label: 'Average' },
          { value: 'count', label: 'Count (unique values)' },
        ]}
        onSourceChange={onSourceChange}
        onLabelChange={onLabelChange}
        onDisplayTypeChange={onDisplayTypeChange}
        onAggregationChange={onAggregationChange}
      />,
    )

    expect(screen.getByRole('group', { name: 'COLUMN 1' })).toContainElement(screen.getByLabelText('Field'))
    await pickField(user, screen.getByLabelText('Field'), 'hours')
    expect(onSourceChange).toHaveBeenCalledWith('hours')

    fireEvent.change(screen.getByLabelText('Display label'), { target: { value: 'Hours' } })
    expect(onLabelChange).toHaveBeenCalledWith('Hours')

    fireEvent.change(screen.getByLabelText('Display type'), { target: { value: 'decimal' } })
    expect(onDisplayTypeChange).toHaveBeenCalledWith('decimal')

    fireEvent.change(screen.getByLabelText('Total type'), { target: { value: 'avg' } })
    expect(onAggregationChange).toHaveBeenCalledWith('avg')
  })
})
