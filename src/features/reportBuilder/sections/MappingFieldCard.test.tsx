import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import type { ReportField } from '../../../services/reportDefinition/types'
import MappingFieldCard from './MappingFieldCard'

function createField(): ReportField {
  return {
    id: 'field-1',
    sourceKey: 'hours',
    label: 'Hours',
    displayType: 'number',
    chipAggregation: 'sum',
    currencySymbol: '',
  }
}

describe('MappingFieldCard', () => {
  it('renders summary and calls edit handler', () => {
    const onStartEditField = vi.fn()

    render(
      <MappingFieldCard
        field={createField()}
        index={0}
        fieldsLength={2}
        draggedFieldId={null}
        dragOverFieldId={null}
        editingFieldId={null}
        editingFieldDraft={null}
        sourceOptions={['hours']}
        displayTypeOptions={[{ value: 'number', label: 'Number' }]}
        chipAggregationOptions={[{ value: 'sum', label: 'Sum' }]}
        minColumns={1}
        onMoveField={() => undefined}
        onStartEditField={onStartEditField}
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

    expect(screen.getByText('Hours')).toBeInTheDocument()
    const editButton = screen.getByRole('button', { name: 'Edit COLUMN 1' })
    fireEvent.click(editButton)
    expect(onStartEditField).toHaveBeenCalledWith(expect.objectContaining({ id: 'field-1' }))
  })

  it('disables remove when at minimum column count', () => {
    render(
      <MappingFieldCard
        field={createField()}
        index={0}
        fieldsLength={1}
        draggedFieldId={null}
        dragOverFieldId={null}
        editingFieldId={null}
        editingFieldDraft={null}
        sourceOptions={['hours']}
        displayTypeOptions={[{ value: 'number', label: 'Number' }]}
        chipAggregationOptions={[{ value: 'sum', label: 'Sum' }]}
        minColumns={1}
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

    expect(screen.getByRole('button', { name: 'Remove' })).toBeDisabled()
  })
})
