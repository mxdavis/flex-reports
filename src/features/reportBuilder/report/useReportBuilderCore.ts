import { useCallback, useMemo } from 'react'
import type { ReportField } from '../../../services/reportDefinition/types'
import { getDefaultCurrencySymbol } from '../../../services/reportDefinition/displayType'
import { getNextFieldId } from '../../../utils/reportBuilder'
import { DEFAULT_MAX_VISIBLE_ROWS, MAX_REPORT_COLUMNS } from '../config'
import type { UiAction } from '../state/uiState'
import { countOutlineRows, getEffectiveExpandedLevels, type OutlineRowCounts } from './model/pivotLayout'
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

  // Stable callbacks (dispatch never changes), so memoized sections such as
  // the table skip re-rendering when unrelated state changes.
  const tableActions = useMemo(() => ({
    setExpandedLevels: (value: number | null) => dispatchUi({ type: 'setExpandedLevels', value }),
    toggleTotals: () => dispatchUi({ type: 'toggleShowTotals' }),
    toggleGrouping: () => dispatchUi({ type: 'toggleGrouping' }),
    toggleFullscreen: () => dispatchUi({ type: 'toggleIsTableFullscreen' }),
    toggleOrientation: () => dispatchUi({ type: 'toggleOrientation' }),
    setGroupExpanded: (groupKey: string, isExpanded: boolean) => {
      dispatchUi({ type: 'setGroupExpanded', groupKey, isExpanded })
    },
  }), [dispatchUi])

  // Large grouped reports open at the deepest outline level that fits within
  // maxVisibleRows. This only changes what's shown; the saved level is kept.
  const maxVisibleRows = args.maxVisibleRows ?? DEFAULT_MAX_VISIBLE_ROWS
  const isGroupingActive = ui.isGroupingEnabled && ui.tableOrientation === 'horizontal'
  const { rows, fields } = state
  const { getMappedValue } = computed
  const outlineRowCounts = useMemo<OutlineRowCounts>(
    () => (isGroupingActive ? countOutlineRows(rows, fields, getMappedValue) : { byLevel: [], all: rows.length }),
    [fields, getMappedValue, isGroupingActive, rows],
  )
  const expandedLevels = getEffectiveExpandedLevels(ui.expandedLevels, outlineRowCounts, maxVisibleRows)

  // A hand-toggled group wins; otherwise the outline level decides.
  const { groupOverrides } = ui
  const isGroupExpanded = useCallback((level: number, groupKey: string): boolean => {
    return groupOverrides[groupKey] ?? (expandedLevels === null || level < expandedLevels)
  }, [expandedLevels, groupOverrides])

  const outline = {
    expandedLevels,
    rowCounts: outlineRowCounts,
    maxVisibleRows,
    isCapped: expandedLevels !== getEffectiveExpandedLevels(ui.expandedLevels, outlineRowCounts, Infinity),
  }

  const actions = {
    ...tableActions,
    isGroupExpanded,
    setIsAddingFormula: (value: boolean) => setUiValue('setIsAddingFormula', value),
    setIsAddingColumn: (value: boolean) => setUiValue('setIsAddingColumn', value),
    setAddColumnPosition: (value: number) => setUiValue('setAddColumnPosition', value),
    setDraggedFieldId: (value: string | null) => setUiValue('setDraggedFieldId', value),
    setDragOverFieldId: (value: string | null) => setUiValue('setDragOverFieldId', value),
    toggleEditMode: () => {
      setUiValue('setIsEditMode', !ui.isEditMode)
      setUiValue('setIsAddingFormula', false)
      setUiValue('setIsAddingColumn', false)
      state.setFormulaError('')
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

  return { state, computed, handlers, actions, outline }
}

export type ReportBuilderCore = ReturnType<typeof useReportBuilderCore>
