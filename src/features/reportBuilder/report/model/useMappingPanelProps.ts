import { AGGREGATION_OPTIONS, DISPLAY_TYPE_OPTIONS, MAX_REPORT_COLUMNS, getDefaultAggregation } from '../../config'
import type { MappingPanelSectionProps } from '../../components/MappingPanelSection'
import type { AggregationMode, DisplayType, ReportField } from '../../../../services/reportDefinition/types'
import { getNextSequencedName } from '../../../../utils/reportBuilder'
import { useReportBuilder } from '../useReportBuilder'
import { getSourceChangePatch } from './columnDraft'

type MappingPanelProps = Omit<MappingPanelSectionProps, 'isCollapsed' | 'onToggleCollapsed'>

function hasUnsavedChanges(field: ReportField, draft: ReportField): boolean {
  return field.sourceKey !== draft.sourceKey
    || field.label !== draft.label
    || field.displayType !== draft.displayType
    || field.aggregation !== draft.aggregation
}

// Column Mapping: its props and every column action (add, edit, move, remove).
export function useMappingPanelProps(): MappingPanelProps {
  const { state, computed } = useReportBuilder()
  const { ui, dispatchUi, fields, setFields } = state
  const { editingField } = ui

  const patchEditingField = (changes: Partial<ReportField>) => dispatchUi({ type: 'patchEditField', changes })
  const stopEditingField = () => dispatchUi({ type: 'stopEditField' })

  // The draft already reflects any source-driven defaults (see
  // getSourceChangePatch), so it is saved as shown.
  function saveEditingField(fieldId: string): void {
    if (!editingField || editingField.id !== fieldId) return
    setFields((previous) => previous.map((field) => (field.id !== fieldId ? field : {
      ...field,
      sourceKey: editingField.sourceKey.trim() || field.sourceKey,
      label: editingField.label.trim() || field.label,
      displayType: editingField.displayType,
      aggregation: editingField.aggregation,
    })))
    stopEditingField()
  }

  // Switching columns with unsaved edits asks whether to save them first.
  function startEditingField(field: ReportField): void {
    const current = editingField && fields.find((candidate) => candidate.id === editingField.id)
    if (current && editingField && current.id !== field.id && hasUnsavedChanges(current, editingField)) {
      dispatchUi({ type: 'set', changes: { switchToFieldId: field.id } })
      return
    }
    dispatchUi({ type: 'startEditField', field })
  }

  const switchToField = fields.find((field) => field.id === ui.switchToFieldId)

  function saveAndSwitch(): void {
    if (!editingField || !switchToField) return
    saveEditingField(editingField.id)
    dispatchUi({ type: 'startEditField', field: switchToField })
  }

  function getColumnSwitchDialog(): MappingPanelProps['columnSwitchDialog'] {
    const fromIndex = fields.findIndex((field) => field.id === editingField?.id)
    const toIndex = switchToField ? fields.indexOf(switchToField) : -1
    if (fromIndex < 0 || toIndex < 0) return null
    const from = `COLUMN ${fromIndex + 1}`
    return {
      title: `Save your changes to ${from}?`,
      message: `You changed ${from} but haven't saved it. Save it before editing COLUMN ${toIndex + 1}?`,
      confirmLabel: 'Save and switch',
      cancelLabel: 'Keep editing',
      onConfirm: saveAndSwitch,
      onCancel: () => dispatchUi({ type: 'set', changes: { switchToFieldId: null } }),
    }
  }

  function moveField(sourceId: string, targetId: string): void {
    if (sourceId === targetId) return
    setFields((previous) => {
      const fromIndex = previous.findIndex((field) => field.id === sourceId)
      const toIndex = previous.findIndex((field) => field.id === targetId)
      if (fromIndex < 0 || toIndex < 0) return previous
      const next = [...previous]
      const [moved] = next.splice(fromIndex, 1)
      next.splice(toIndex, 0, moved)
      return next
    })
  }

  // A fresh Add column draft for a source, with that source's type defaults.
  function draftForSource(sourceKey: string): ReportField {
    const displayType = computed.getPreferredDisplayType(sourceKey)
    return {
      id: 'new-column',
      label: computed.getSourceLabel(sourceKey),
      sourceKey,
      displayType,
      aggregation: getDefaultAggregation(displayType),
    }
  }

  const patchNewColumn = (changes: Partial<ReportField>, position?: number) => {
    dispatchUi({ type: 'patchNewColumn', changes, position })
  }
  const closeNewColumn = () => dispatchUi({ type: 'set', changes: { newColumn: null } })

  function saveNewColumn(): void {
    if (!ui.newColumn) return
    const { position, draft } = ui.newColumn
    const sourceKey = draft.sourceKey.trim()
    if (!sourceKey) return
    setFields((previous) => {
      if (previous.length >= MAX_REPORT_COLUMNS) return previous
      const next = [...previous]
      next.splice(Math.min(Math.max(position - 1, 0), previous.length), 0, {
        ...draft,
        id: getNextSequencedName('field-', previous.map((field) => field.id)),
        label: draft.label.trim() || computed.getSourceLabel(sourceKey),
        sourceKey,
      })
      return next
    })
    closeNewColumn()
  }

  return {
    fields,
    columnSwitchDialog: getColumnSwitchDialog(),
    newColumn: ui.newColumn,
    maxColumns: MAX_REPORT_COLUMNS,
    showTips: state.showTips,
    skippedFields: state.skippedFields,
    getFieldWarning: computed.getFieldWarning,
    draggedFieldId: ui.draggedFieldId,
    dragOverFieldId: ui.dragOverFieldId,
    editingFieldId: editingField?.id ?? null,
    editingFieldDraft: editingField,
    sourceOptions: computed.sourceOptions,
    displayTypeOptions: DISPLAY_TYPE_OPTIONS,
    aggregationOptions: AGGREGATION_OPTIONS,
    onStartAddColumn: () => {
      // Starts blank so the person picks the field rather than accepting a guess.
      const newColumn = { position: fields.length + 1, draft: draftForSource('') }
      dispatchUi({ type: 'set', changes: { newColumn } })
    },
    onCancelAddColumn: closeNewColumn,
    onAddColumnPositionChange: (value: number) => patchNewColumn({}, value),
    onAddColumnSourceKeyChange: (value: string) => patchNewColumn(draftForSource(value)),
    onAddColumnLabelChange: (value: string) => patchNewColumn({ label: value }),
    onAddColumnDisplayTypeChange: (value: DisplayType) => patchNewColumn({ displayType: value, aggregation: getDefaultAggregation(value) }),
    onAddColumnAggregationChange: (value: AggregationMode) => patchNewColumn({ aggregation: value }),
    onSaveNewColumn: saveNewColumn,
    onMoveField: moveField,
    onStartEditField: startEditingField,
    onCancelEditField: stopEditingField,
    onSaveEditField: saveEditingField,
    onRemoveField: (fieldId: string) => {
      setFields((previous) => previous.filter((field) => field.id !== fieldId))
      if (editingField?.id === fieldId) stopEditingField()
    },
    onSetDraggedFieldId: (value: string | null) => dispatchUi({ type: 'set', changes: { draggedFieldId: value } }),
    onSetDragOverFieldId: (value: string | null) => dispatchUi({ type: 'set', changes: { dragOverFieldId: value } }),
    onSetEditingFieldSourceKey: (value: string) => {
      if (!editingField) return
      patchEditingField(getSourceChangePatch({
        draft: editingField,
        nextSourceKey: value,
        getPreferredDisplayType: computed.getPreferredDisplayType,
      }))
    },
    onSetEditingFieldLabel: (value: string) => patchEditingField({ label: value }),
    onSetEditingFieldDisplayType: (value: DisplayType) => patchEditingField({ displayType: value }),
    onSetEditingFieldAggregation: (value: AggregationMode) => patchEditingField({ aggregation: value }),
  }
}
