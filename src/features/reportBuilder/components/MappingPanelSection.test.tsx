import { fireEvent, render, screen, within } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import type { ReportField } from '../../../services/reportDefinition/types'
import MappingPanelSection from './MappingPanelSection'

const fields: ReportField[] = [
  {
    id: 'field1',
    label: 'workDate',
    sourceKey: 'workDate',
    displayType: 'date',
    chipAggregation: 'count',
    currencySymbol: '',
  },
]

describe('MappingPanelSection', () => {
  it('renders section with report-columns id', () => {
    render(
      <MappingPanelSection
        fields={fields}
        isAddingColumn={false}
        addColumnPosition={1}
        addColumnSourceKey="workDate"
        addColumnLabel="workDate"
        addColumnDisplayType="date"
        addColumnChipAggregation="count"
        maxColumns={15}
        minColumns={1}
        draggedFieldId={null}
        dragOverFieldId={null}
        editingFieldId={null}
        editingFieldDraft={null}
        sourceOptions={['workDate']}
        displayTypeOptions={[{ value: 'date', label: 'Date' }]}
        chipAggregationOptions={[{ value: 'count', label: 'Count (unique values)' }]}
        onStartAddColumn={() => undefined}
        onCancelAddColumn={() => undefined}
        onAddColumnPositionChange={() => undefined}
        onAddColumnSourceKeyChange={() => undefined}
        onAddColumnLabelChange={() => undefined}
        onAddColumnDisplayTypeChange={() => undefined}
        onAddColumnChipAggregationChange={() => undefined}
        onSaveNewColumn={() => undefined}
        onMoveField={() => undefined}
        onStartEditField={() => undefined}
        onCancelEditField={() => undefined}
        onSaveEditField={() => undefined}
        onRemoveField={() => undefined}
        onSetDraggedFieldId={() => undefined}
        onSetDragOverFieldId={() => undefined}
        onSetEditingFieldSourceKey={() => undefined}
        onSetEditingFieldLabel={() => undefined}
        onSetEditingFieldDisplayType={() => undefined}
        onSetEditingFieldChipAggregation={() => undefined}
      />,
    )

    const heading = screen.getByRole('heading', { name: 'Column Mapping' })
    const section = heading.closest('section')
    expect(section?.id).toBe('report-columns')
  })

  it('forwards add column intent', () => {
    const onStartAddColumn = vi.fn()
    const { container } = render(
      <MappingPanelSection
        fields={fields}
        isAddingColumn={false}
        addColumnPosition={1}
        addColumnSourceKey="workDate"
        addColumnLabel="workDate"
        addColumnDisplayType="date"
        addColumnChipAggregation="count"
        maxColumns={15}
        minColumns={1}
        draggedFieldId={null}
        dragOverFieldId={null}
        editingFieldId={null}
        editingFieldDraft={null}
        sourceOptions={['workDate']}
        displayTypeOptions={[{ value: 'date', label: 'Date' }]}
        chipAggregationOptions={[{ value: 'count', label: 'Count (unique values)' }]}
        onStartAddColumn={onStartAddColumn}
        onCancelAddColumn={() => undefined}
        onAddColumnPositionChange={() => undefined}
        onAddColumnSourceKeyChange={() => undefined}
        onAddColumnLabelChange={() => undefined}
        onAddColumnDisplayTypeChange={() => undefined}
        onAddColumnChipAggregationChange={() => undefined}
        onSaveNewColumn={() => undefined}
        onMoveField={() => undefined}
        onStartEditField={() => undefined}
        onCancelEditField={() => undefined}
        onSaveEditField={() => undefined}
        onRemoveField={() => undefined}
        onSetDraggedFieldId={() => undefined}
        onSetDragOverFieldId={() => undefined}
        onSetEditingFieldSourceKey={() => undefined}
        onSetEditingFieldLabel={() => undefined}
        onSetEditingFieldDisplayType={() => undefined}
        onSetEditingFieldChipAggregation={() => undefined}
      />,
    )

    const section = container.querySelector('#report-columns')
    expect(section).toBeTruthy()
    if (!(section instanceof HTMLElement)) {
      return
    }

    fireEvent.click(within(section).getByRole('button', { name: 'Add column' }))
    expect(onStartAddColumn).toHaveBeenCalledTimes(1)
  })
})
