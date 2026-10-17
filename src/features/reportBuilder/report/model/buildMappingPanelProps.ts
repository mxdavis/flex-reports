import type { Dispatch, SetStateAction } from 'react'
import { AGGREGATION_OPTIONS, DISPLAY_TYPE_OPTIONS, MAX_REPORT_COLUMNS, MIN_REPORT_COLUMNS, getDefaultAggregation } from '../../config'
import type { AggregationMode, DisplayType, ReportField } from '../../../../services/reportDefinition/types'

type BuildMappingPanelPropsArgs = {
  showTips: boolean
  getFieldWarning: (field: ReportField) => string | null
  reportFields: ReportField[]
  isAddingColumn: boolean
  addColumnPosition: number
  addColumnSourceKey: string
  addColumnLabel: string
  addColumnDisplayType: DisplayType
  addColumnAggregation: AggregationMode
  draggedFieldId: string | null
  dragOverFieldId: string | null
  editingFieldId: string | null
  editingFieldDraft: ReportField | null
  sourceOptions: string[]
  setAddColumnSourceKey: (value: string) => void
  setAddColumnLabel: (value: string) => void
  setAddColumnDisplayType: (value: DisplayType) => void
  setAddColumnAggregation: (value: AggregationMode) => void
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
  setFields: Dispatch<SetStateAction<ReportField[]>>
}

export function buildMappingPanelProps(args: BuildMappingPanelPropsArgs) {
  return {
    fields: args.reportFields,
    isAddingColumn: args.isAddingColumn,
    addColumnPosition: args.addColumnPosition,
    addColumnSourceKey: args.addColumnSourceKey,
    addColumnLabel: args.addColumnLabel,
    addColumnDisplayType: args.addColumnDisplayType,
    addColumnAggregation: args.addColumnAggregation,
    maxColumns: MAX_REPORT_COLUMNS,
    showTips: args.showTips,
    getFieldWarning: args.getFieldWarning,
    minColumns: MIN_REPORT_COLUMNS,
    draggedFieldId: args.draggedFieldId,
    dragOverFieldId: args.dragOverFieldId,
    editingFieldId: args.editingFieldId,
    editingFieldDraft: args.editingFieldDraft,
    sourceOptions: args.sourceOptions,
    displayTypeOptions: DISPLAY_TYPE_OPTIONS,
    aggregationOptions: AGGREGATION_OPTIONS,
    onStartAddColumn: () => {
      const defaultSourceKey = args.sourceOptions[0] ?? ''
      const defaultDisplayType = args.getPreferredDisplayType(defaultSourceKey)
      args.setAddColumnSourceKey(defaultSourceKey)
      args.setAddColumnLabel(defaultSourceKey)
      args.setAddColumnDisplayType(defaultDisplayType)
      args.setAddColumnAggregation(getDefaultAggregation(defaultDisplayType))
      args.setAddColumnPosition(args.reportFields.length + 1)
      args.setIsAddingColumn(true)
    },
    onCancelAddColumn: () => args.setIsAddingColumn(false),
    onAddColumnPositionChange: args.setAddColumnPosition,
    onAddColumnSourceKeyChange: (value: string) => {
      const nextDisplayType = args.getPreferredDisplayType(value)
      args.setAddColumnSourceKey(value)
      args.setAddColumnLabel(value)
      args.setAddColumnDisplayType(nextDisplayType)
      args.setAddColumnAggregation(getDefaultAggregation(nextDisplayType))
    },
    onAddColumnLabelChange: args.setAddColumnLabel,
    onAddColumnDisplayTypeChange: (value: DisplayType) => {
      args.setAddColumnDisplayType(value)
      args.setAddColumnAggregation(getDefaultAggregation(value))
    },
    onAddColumnAggregationChange: args.setAddColumnAggregation,
    onSaveNewColumn: () => {
      args.handleAddColumnAtPosition()
      args.setIsAddingColumn(false)
    },
    onMoveField: args.moveField,
    onStartEditField: args.handleStartEditField,
    onCancelEditField: args.handleCancelEditField,
    onSaveEditField: args.handleSaveEditField,
    onRemoveField: (fieldId: string) => {
      args.setFields((previous) => {
        if (previous.length <= MIN_REPORT_COLUMNS) return previous
        return previous.filter((current) => current.id !== fieldId)
      })
      if (args.editingFieldId === fieldId) {
        args.handleCancelEditField()
      }
    },
    onSetDraggedFieldId: args.setDraggedFieldId,
    onSetDragOverFieldId: args.setDragOverFieldId,
    onSetEditingFieldSourceKey: (value: string) => args.patchEditingFieldDraft({ sourceKey: value }),
    onSetEditingFieldLabel: (value: string) => args.patchEditingFieldDraft({ label: value }),
    onSetEditingFieldDisplayType: (value: DisplayType) => args.patchEditingFieldDraft({ displayType: value }),
    onSetEditingFieldAggregation: (value: AggregationMode) => args.patchEditingFieldDraft({ aggregation: value }),
  }
}
