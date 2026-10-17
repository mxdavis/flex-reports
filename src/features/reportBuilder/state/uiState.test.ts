import { describe, expect, it } from 'vitest'
import type { ReportField } from '../../../services/reportDefinition/types'
import { createInitialUiState, uiReducer, type UiState } from './uiState'

const initial: UiState = createInitialUiState({
  initialEditMode: true,
  initialView: { orientation: 'horizontal', showTotals: false, isGroupingEnabled: true, expandedLevels: 1 },
})
const field: ReportField = { id: 'f1', label: 'Units', sourceKey: 'units', displayType: 'number', aggregation: 'sum', currencySymbol: '' }

describe('uiReducer', () => {
  it('starts from the saved view', () => {
    expect(initial).toMatchObject({ isEditMode: true, isGroupingEnabled: true, expandedLevels: 1, editingField: null })
  })

  it('sets and toggles plain values', () => {
    expect(uiReducer(initial, { type: 'set', changes: { addColumnPosition: 3 } }).addColumnPosition).toBe(3)
    expect(uiReducer(initial, { type: 'toggle', key: 'showTotals' }).showTotals).toBe(true)
  })

  it('closes half-open add forms when toggling edit mode', () => {
    const adding = { ...initial, isAddingColumn: true, isAddingFormula: true }

    expect(uiReducer(adding, { type: 'toggleEditMode' })).toMatchObject({ isEditMode: false, isAddingColumn: false, isAddingFormula: false })
  })

  it('turns grouping off when switching to vertical', () => {
    const vertical = uiReducer(initial, { type: 'toggleOrientation' })

    expect(vertical).toMatchObject({ tableOrientation: 'vertical', isGroupingEnabled: false })
    expect(uiReducer(vertical, { type: 'toggleOrientation' }).tableOrientation).toBe('horizontal')
  })

  it('clears hand-toggled groups when the outline level changes', () => {
    const toggled = uiReducer(initial, { type: 'setGroupExpanded', groupKey: '["North"]', isExpanded: false })
    expect(toggled.groupOverrides).toEqual({ '["North"]': false })

    expect(uiReducer(toggled, { type: 'setExpandedLevels', value: null })).toMatchObject({ expandedLevels: null, groupOverrides: {} })
  })

  it('edits a column draft without touching the original', () => {
    const editing = uiReducer(initial, { type: 'startEditField', field })
    const patched = uiReducer(editing, { type: 'patchEditField', changes: { label: 'Qty' } })

    expect(patched.editingField).toEqual({ ...field, label: 'Qty' })
    expect(field.label).toBe('Units')
    expect(uiReducer(patched, { type: 'stopEditField' }).editingField).toBeNull()
    expect(uiReducer(initial, { type: 'patchEditField', changes: { label: 'x' } })).toBe(initial)
  })

  it('keeps a formula draft\'s original label so a rename can repoint columns', () => {
    const editing = uiReducer(initial, { type: 'startEditFormula', formula: { label: 'gross', expression: '{{a}}' } })
    const renamed = uiReducer(editing, { type: 'patchEditFormula', changes: { label: 'net' } })

    expect(renamed.editingFormula).toEqual({ originalLabel: 'gross', draft: { label: 'net', expression: '{{a}}' } })
  })
})
