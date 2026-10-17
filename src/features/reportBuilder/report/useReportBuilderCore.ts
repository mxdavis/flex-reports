import type { ReportField } from '../../../services/reportDefinition/types'
import { getDefaultCurrencySymbol } from '../../../services/reportDefinition/displayType'
import { getNextFieldId } from '../../../utils/reportBuilder'
import { MAX_REPORT_COLUMNS } from '../config'
import type { UiAction } from '../state/uiState'
import { useReportBuilderComputed } from './model/useReportBuilderComputed'
import { useReportBuilderHandlers } from './model/useReportBuilderHandlers'
import { useReportBuilderState, type ReportBuilderStateArgs } from './model/useReportBuilderState'

type UiValueAction = Extract<UiAction, { value: unknown }>

// Runs the builder once: state, derived data, and actions. The provider shares
// the result through context, and each section reads only what it needs.
export function useReportBuilderCore(args: ReportBuilderStateArgs) {
  const state = useReportBuilderState(args)
  const { ui, dispatchUi } = state

  const setUiValue = <TType extends UiValueAction['type']>(
    type: TType,
    value: Extract<UiValueAction, { type: TType }>['value'],
  ): void => {
    dispatchUi({ type, value } as UiValueAction)
  }

  const computed = useReportBuilderComputed({
    rows: state.rows,
    sourceColumns: state.sourceColumns,
    reportFields: state.fields,
    formulas: state.formulas,
    currencySymbol: state.currencySymbol,
    tableOrientation: ui.tableOrientation,
    showTips: state.showTips,
  })

  const handlers = useReportBuilderHandlers({
    ui,
    dispatchUi,
    reportFields: state.fields,
    setReportFields: state.setFields,
    formulas: state.formulas,
    setFormulas: state.setFormulas,
    newFormula: state.newFormula,
    setNewFormula: state.setNewFormula,
    setFormulaError: state.setFormulaError,
    setEditingFormulaError: state.setEditingFormulaError,
    clearEditingFormulaError: () => state.setEditingFormulaError(''),
  })

  const actions = {
    setIsAddingFormula: (value: boolean) => setUiValue('setIsAddingFormula', value),
    setIsAddingColumn: (value: boolean) => setUiValue('setIsAddingColumn', value),
    setAddColumnPosition: (value: number) => setUiValue('setAddColumnPosition', value),
    setDraggedFieldId: (value: string | null) => setUiValue('setDraggedFieldId', value),
    setDragOverFieldId: (value: string | null) => setUiValue('setDragOverFieldId', value),
    setExpandedLevels: (value: number | null) => setUiValue('setExpandedLevels', value),
    toggleTotals: () => setUiValue('setShowTotals', !ui.showTotals),
    toggleGrouping: () => setUiValue('setIsGroupingEnabled', !ui.isGroupingEnabled),
    toggleFullscreen: () => setUiValue('setIsTableFullscreen', !ui.isTableFullscreen),
    // Grouping only exists horizontally, so turning vertical switches it off.
    toggleOrientation: () => {
      if (ui.tableOrientation === 'horizontal') {
        setUiValue('setIsGroupingEnabled', false)
        setUiValue('setTableOrientation', 'vertical')
        return
      }
      setUiValue('setTableOrientation', 'horizontal')
    },
    toggleEditMode: () => {
      setUiValue('setIsEditMode', !ui.isEditMode)
      setUiValue('setIsAddingFormula', false)
      setUiValue('setIsAddingColumn', false)
      state.setFormulaError('')
    },
    setGroupExpanded: (groupKey: string, isExpanded: boolean) => {
      dispatchUi({ type: 'setGroupExpanded', groupKey, isExpanded })
    },
    // A hand-toggled group wins; otherwise the outline level decides.
    isGroupExpanded: (level: number, groupKey: string): boolean => {
      return ui.groupOverrides[groupKey] ?? (ui.expandedLevels === null || level < ui.expandedLevels)
    },
    addColumnAtPosition: () => {
      state.setFields((previous) => {
        if (previous.length >= MAX_REPORT_COLUMNS) return previous
        const insertionIndex = Math.min(Math.max(ui.addColumnPosition - 1, 0), previous.length)
        const nextSourceKey = state.addColumnSourceKey.trim() || computed.sourceOptions[0]
        if (!nextSourceKey) return previous
        const nextDisplayType = state.addColumnDisplayType || computed.getPreferredDisplayType(nextSourceKey)
        const nextField: ReportField = {
          id: getNextFieldId(previous.map((field) => field.id)),
          label: state.addColumnLabel.trim() || nextSourceKey,
          sourceKey: nextSourceKey,
          displayType: nextDisplayType,
          aggregation: state.addColumnAggregation,
          currencySymbol: getDefaultCurrencySymbol(nextDisplayType),
        }
        const fields = [...previous]
        fields.splice(insertionIndex, 0, nextField)
        return fields
      })
    },
    jumpToSection: (sectionId: string) => {
      const section = document.getElementById(sectionId)
      if (!section) return
      section.scrollIntoView({ behavior: 'smooth', block: 'start' })
      window.history.replaceState(null, '', `#${sectionId}`)
    },
  }

  return { state, computed, handlers, actions }
}

export type ReportBuilderCore = ReturnType<typeof useReportBuilderCore>
