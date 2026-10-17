import { AGGREGATION_OPTIONS, DISPLAY_TYPE_OPTIONS, MAX_REPORT_COLUMNS, MIN_REPORT_COLUMNS, getDefaultAggregation } from '../../config'
import type { MappingPanelSectionProps } from '../../components/MappingPanelSection'
import type { AggregationMode, DisplayType } from '../../../../services/reportDefinition/types'
import { useReportBuilder } from '../useReportBuilder'
import { getSourceChangePatch } from './columnDraft'

type MappingPanelProps = Omit<MappingPanelSectionProps, 'isCollapsed' | 'onToggleCollapsed'>

export function useMappingPanelProps(): MappingPanelProps {
  const { state, computed, handlers, actions } = useReportBuilder()
  const { ui } = state

  return {
    fields: state.fields,
    isAddingColumn: ui.isAddingColumn,
    addColumnPosition: ui.addColumnPosition,
    addColumnSourceKey: state.addColumnSourceKey,
    addColumnLabel: state.addColumnLabel,
    addColumnDisplayType: state.addColumnDisplayType,
    addColumnAggregation: state.addColumnAggregation,
    maxColumns: MAX_REPORT_COLUMNS,
    showTips: state.showTips,
    getFieldWarning: computed.getFieldWarning,
    minColumns: MIN_REPORT_COLUMNS,
    draggedFieldId: ui.draggedFieldId,
    dragOverFieldId: ui.dragOverFieldId,
    editingFieldId: ui.editingFieldId,
    editingFieldDraft: ui.editingFieldDraft,
    sourceOptions: computed.sourceOptions,
    displayTypeOptions: DISPLAY_TYPE_OPTIONS,
    aggregationOptions: AGGREGATION_OPTIONS,
    onStartAddColumn: () => {
      const defaultSourceKey = computed.sourceOptions[0] ?? ''
      const defaultDisplayType = computed.getPreferredDisplayType(defaultSourceKey)
      state.setAddColumnSourceKey(defaultSourceKey)
      state.setAddColumnLabel(defaultSourceKey)
      state.setAddColumnDisplayType(defaultDisplayType)
      state.setAddColumnAggregation(getDefaultAggregation(defaultDisplayType))
      actions.setAddColumnPosition(state.fields.length + 1)
      actions.setIsAddingColumn(true)
    },
    onCancelAddColumn: () => actions.setIsAddingColumn(false),
    onAddColumnPositionChange: actions.setAddColumnPosition,
    onAddColumnSourceKeyChange: (value: string) => {
      const nextDisplayType = computed.getPreferredDisplayType(value)
      state.setAddColumnSourceKey(value)
      state.setAddColumnLabel(value)
      state.setAddColumnDisplayType(nextDisplayType)
      state.setAddColumnAggregation(getDefaultAggregation(nextDisplayType))
    },
    onAddColumnLabelChange: state.setAddColumnLabel,
    onAddColumnDisplayTypeChange: (value: DisplayType) => {
      state.setAddColumnDisplayType(value)
      state.setAddColumnAggregation(getDefaultAggregation(value))
    },
    onAddColumnAggregationChange: state.setAddColumnAggregation,
    onSaveNewColumn: () => {
      actions.addColumnAtPosition()
      actions.setIsAddingColumn(false)
    },
    onMoveField: handlers.moveField,
    onStartEditField: handlers.handleStartEditField,
    onCancelEditField: handlers.handleCancelEditField,
    onSaveEditField: handlers.handleSaveEditField,
    onRemoveField: (fieldId: string) => {
      state.setFields((previous) => {
        if (previous.length <= MIN_REPORT_COLUMNS) return previous
        return previous.filter((current) => current.id !== fieldId)
      })
      if (ui.editingFieldId === fieldId) {
        handlers.handleCancelEditField()
      }
    },
    onSetDraggedFieldId: actions.setDraggedFieldId,
    onSetDragOverFieldId: actions.setDragOverFieldId,
    onSetEditingFieldSourceKey: (value: string) => {
      const original = state.fields.find((field) => field.id === ui.editingFieldId)
      if (!ui.editingFieldDraft || !original) return
      handlers.patchEditingFieldDraft(getSourceChangePatch({
        draft: ui.editingFieldDraft,
        original,
        nextSourceKey: value,
        isKnownSource: (sourceKey) => computed.sourceOptions.includes(sourceKey),
        getPreferredDisplayType: computed.getPreferredDisplayType,
      }))
    },
    onSetEditingFieldLabel: (value: string) => handlers.patchEditingFieldDraft({ label: value }),
    onSetEditingFieldDisplayType: (value: DisplayType) => handlers.patchEditingFieldDraft({ displayType: value }),
    onSetEditingFieldAggregation: (value: AggregationMode) => handlers.patchEditingFieldDraft({ aggregation: value }),
  }
}
