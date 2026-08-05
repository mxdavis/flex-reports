import type { Dispatch, SetStateAction } from 'react'
import { CHIP_AGGREGATION_OPTIONS, DISPLAY_TYPE_OPTIONS, MAX_REPORT_COLUMNS, MIN_REPORT_COLUMNS, getDefaultChipAggregation } from '../../config'
import type { ChipAggregationMode, DisplayType, ReportData, ReportField } from '../../../../services/reportDefinition/types'

type BuildMappingPanelPropsArgs = {
  reportFields: ReportField[]
  isAddingColumn: boolean
  addColumnPosition: number
  addColumnSourceKey: string
  addColumnLabel: string
  addColumnDisplayType: DisplayType
  addColumnChipAggregation: ChipAggregationMode
  draggedFieldId: string | null
  dragOverFieldId: string | null
  editingFieldId: string | null
  editingFieldDraft: ReportField | null
  sourceOptions: string[]
  setAddColumnSourceKey: (value: string) => void
  setAddColumnLabel: (value: string) => void
  setAddColumnDisplayType: (value: DisplayType) => void
  setAddColumnChipAggregation: (value: ChipAggregationMode) => void
  setAddColumnPosition: (value: number) => void
  setIsAddingColumn: (value: boolean) => void
  setDraggedFieldId: (value: string | null) => void
  setDragOverFieldId: (value: string | null) => void
  patchEditingFieldDraft: (patch: Partial<ReportField>) => void
  getPreferredDisplayType: (sourceKey: string) => DisplayType
  handleAddColumnAtPosition: () => void
  moveField: (sourceId: string, targetId: string) => void
  handleStartEditField: (field: ReportField) => void
  handleCancelEditField: () => void
  handleSaveEditField: (fieldId: string) => void
  setReportData: Dispatch<SetStateAction<ReportData>>
}

export function buildMappingPanelProps({
  reportFields,
  isAddingColumn,
  addColumnPosition,
  addColumnSourceKey,
  addColumnLabel,
  addColumnDisplayType,
  addColumnChipAggregation,
  draggedFieldId,
  dragOverFieldId,
  editingFieldId,
  editingFieldDraft,
  sourceOptions,
  setAddColumnSourceKey,
  setAddColumnLabel,
  setAddColumnDisplayType,
  setAddColumnChipAggregation,
  setAddColumnPosition,
  setIsAddingColumn,
  setDraggedFieldId,
  setDragOverFieldId,
  patchEditingFieldDraft,
  getPreferredDisplayType,
  handleAddColumnAtPosition,
  moveField,
  handleStartEditField,
  handleCancelEditField,
  handleSaveEditField,
  setReportData,
}: BuildMappingPanelPropsArgs) {
  return {
    fields: reportFields,
    isAddingColumn,
    addColumnPosition,
    addColumnSourceKey,
    addColumnLabel,
    addColumnDisplayType,
    addColumnChipAggregation,
    maxColumns: MAX_REPORT_COLUMNS,
    minColumns: MIN_REPORT_COLUMNS,
    draggedFieldId,
    dragOverFieldId,
    editingFieldId,
    editingFieldDraft,
    sourceOptions,
    displayTypeOptions: DISPLAY_TYPE_OPTIONS,
    chipAggregationOptions: CHIP_AGGREGATION_OPTIONS,
    onStartAddColumn: () => {
      const defaultSourceKey = sourceOptions[0] ?? 'workDate'
      const defaultDisplayType = getPreferredDisplayType(defaultSourceKey)
      setAddColumnSourceKey(defaultSourceKey)
      setAddColumnLabel(defaultSourceKey)
      setAddColumnDisplayType(defaultDisplayType)
      setAddColumnChipAggregation(getDefaultChipAggregation(defaultDisplayType))
      setAddColumnPosition(reportFields.length + 1)
      setIsAddingColumn(true)
    },
    onCancelAddColumn: () => setIsAddingColumn(false),
    onAddColumnPositionChange: setAddColumnPosition,
    onAddColumnSourceKeyChange: (value: string) => {
      const nextDisplayType = getPreferredDisplayType(value)
      setAddColumnSourceKey(value)
      setAddColumnLabel(value)
      setAddColumnDisplayType(nextDisplayType)
      setAddColumnChipAggregation(getDefaultChipAggregation(nextDisplayType))
    },
    onAddColumnLabelChange: setAddColumnLabel,
    onAddColumnDisplayTypeChange: (value: DisplayType) => {
      setAddColumnDisplayType(value)
      setAddColumnChipAggregation(getDefaultChipAggregation(value))
    },
    onAddColumnChipAggregationChange: setAddColumnChipAggregation,
    onSaveNewColumn: () => {
      handleAddColumnAtPosition()
      setIsAddingColumn(false)
    },
    onMoveField: moveField,
    onStartEditField: handleStartEditField,
    onCancelEditField: handleCancelEditField,
    onSaveEditField: handleSaveEditField,
    onRemoveField: (fieldId: string) => {
      setReportData((previous) => {
        if (previous.fields.length <= MIN_REPORT_COLUMNS) return previous
        return { ...previous, fields: previous.fields.filter((current) => current.id !== fieldId) }
      })
      if (editingFieldId === fieldId) {
        handleCancelEditField()
      }
    },
    onSetDraggedFieldId: setDraggedFieldId,
    onSetDragOverFieldId: setDragOverFieldId,
    onSetEditingFieldSourceKey: (value: string) => patchEditingFieldDraft({ sourceKey: value }),
    onSetEditingFieldLabel: (value: string) => patchEditingFieldDraft({ label: value }),
    onSetEditingFieldDisplayType: (value: DisplayType) => patchEditingFieldDraft({ displayType: value }),
    onSetEditingFieldChipAggregation: (value: ChipAggregationMode) => patchEditingFieldDraft({ chipAggregation: value }),
  }
}
