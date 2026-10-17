import { useCallback, useMemo } from 'react'
import type { EditModeToolbarProps } from '../../components/EditModeToolbar'
import type { ReportTableSectionProps } from '../../components/ReportTableSection'
import type { ReportSettingsSectionProps } from '../../components/ReportSettingsSection'
import { DEFAULT_SHEET_NAME, EDIT_MODE_JUMP_TARGETS, MAX_VERTICAL_VIEW_ROWS } from '../../config'
import { useElementIdPrefix } from '../../../../shared/hooks/useElementId'
import { useReportBuilder } from '../useReportBuilder'
import { countOutlineRows, getEffectiveExpandedLevels, getTreeLayout, type OutlineRowCounts } from './pivotLayout'

// Only scrolls: the URL belongs to the host app (writing a #hash would clobber
// its router's state).
function jumpToSection(sectionId: string): void {
  document.getElementById(sectionId)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
}

export function useToolbarProps(): EditModeToolbarProps {
  const { state } = useReportBuilder()
  const idPrefix = useElementIdPrefix()
  return {
    isEditMode: state.ui.isEditMode,
    canSave: state.canSave,
    isDirty: state.saveState.isDirty,
    isSaving: state.saveState.isSaving,
    saveError: state.saveState.saveError,
    saveBlockedReason: state.saveBlockedReason,
    onSave: () => {
      void state.saveState.save()
    },
    jumpTargets: EDIT_MODE_JUMP_TARGETS.map((target) => ({ id: `${idPrefix}-${target.section}`, label: target.label })),
    onJumpToSection: jumpToSection,
    onToggle: () => {
      state.dispatchUi({ type: 'toggleEditMode' })
      state.setFormulaError('')
    },
  }
}

export function useReportSettingsProps(): Omit<ReportSettingsSectionProps, 'isCollapsed' | 'onToggleCollapsed'> {
  const { state } = useReportBuilder()
  return {
    sheetName: state.sheetName,
    currencySymbol: state.currencySymbol,
    onSheetNameChange: state.setSheetName,
    onCurrencySymbolChange: state.setCurrencySymbol,
  }
}

export function useTableSectionProps(): ReportTableSectionProps {
  const { state, computed, isVerticalViewAvailable, maxVisibleRows } = useReportBuilder()
  const { ui, dispatchUi, rows, fields } = state
  const { getFieldValue } = computed

  // Stable callbacks (dispatch never changes), so the memoized table skips
  // re-rendering when unrelated state changes.
  const tableActions = useMemo(() => ({
    onToggleTotals: () => dispatchUi({ type: 'toggle', key: 'showTotals' }),
    onToggleGrouping: () => dispatchUi({ type: 'toggle', key: 'isGroupingEnabled' }),
    onToggleFullscreen: () => dispatchUi({ type: 'toggle', key: 'isTableFullscreen' }),
    onToggleOrientation: () => dispatchUi({ type: 'toggleOrientation' }),
    onExpandedLevelsChange: (value: number | null) => dispatchUi({ type: 'setExpandedLevels', value }),
    onToggleGroup: (groupKey: string, isExpanded: boolean) => dispatchUi({ type: 'setGroupExpanded', groupKey, isExpanded }),
  }), [dispatchUi])

  // Large grouped reports open at the deepest outline level that fits within
  // maxVisibleRows. This only changes what's shown; the saved level is kept.
  // Grouping is decided here once: on (the button) and grouped (there's a
  // column to group by). Every grouping-dependent piece reads these.
  const isGroupingOn = ui.isGroupingEnabled && computed.isHorizontalTable
  const isGrouped = isGroupingOn && getTreeLayout(fields).groupCount > 0
  const outlineRowCounts = useMemo<OutlineRowCounts>(
    () => (isGrouped ? countOutlineRows(rows, fields, getFieldValue) : { byLevel: [], all: rows.length }),
    [fields, getFieldValue, isGrouped, rows],
  )
  const expandedLevels = getEffectiveExpandedLevels(ui.expandedLevels, outlineRowCounts, maxVisibleRows)

  // A hand-toggled group wins; otherwise the outline level decides.
  const { groupOverrides } = ui
  const isGroupExpanded = useCallback((level: number, groupKey: string): boolean => {
    return groupOverrides[groupKey] ?? (expandedLevels === null || level < expandedLevels)
  }, [expandedLevels, groupOverrides])

  return {
    ...tableActions,
    sheetName: state.sheetName.trim().length > 0 ? state.sheetName : DEFAULT_SHEET_NAME,
    isTableFullscreen: ui.isTableFullscreen,
    isHorizontalTable: computed.isHorizontalTable,
    showTotals: ui.showTotals,
    isGroupingOn,
    isGrouped,
    expandedLevels,
    outlineRowCounts,
    maxVisibleRows,
    isOutlineCapped: expandedLevels !== getEffectiveExpandedLevels(ui.expandedLevels, outlineRowCounts, Infinity),
    isVerticalViewAvailable,
    maxVerticalViewRows: MAX_VERTICAL_VIEW_ROWS,
    showTips: state.showTips,
    fields,
    rows,
    verticalColumns: computed.verticalColumns,
    scrollContainerRef: state.tableScrollRef,
    getFieldValue,
    getRawValue: computed.getMappedRawValue,
    formatFieldTotal: computed.formatFieldTotal,
    getFieldWarning: computed.getFieldWarning,
    isGroupExpanded,
  }
}
