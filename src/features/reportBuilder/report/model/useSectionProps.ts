import type { EditModeToolbarProps } from '../../components/EditModeToolbar'
import type { ReportTableSectionProps } from '../../components/ReportTableSection'
import type { ReportSettingsSectionProps } from '../../components/ReportSettingsSection'
import { DEFAULT_SHEET_NAME, EDIT_MODE_JUMP_TARGETS } from '../../config'
import { useReportBuilder } from '../useReportBuilder'

export function useToolbarProps(): EditModeToolbarProps {
  const { state, actions } = useReportBuilder()
  return {
    isEditMode: state.ui.isEditMode,
    canSave: state.canSave,
    isDirty: state.saveState.isDirty,
    isSaving: state.saveState.isSaving,
    saveError: state.saveState.saveError,
    onSave: () => {
      void state.saveState.save()
    },
    jumpTargets: EDIT_MODE_JUMP_TARGETS,
    onJumpToSection: actions.jumpToSection,
    onToggle: actions.toggleEditMode,
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
  const { state, computed, actions, outline, vertical } = useReportBuilder()
  const { ui } = state
  return {
    sheetName: state.sheetName.trim().length > 0 ? state.sheetName : DEFAULT_SHEET_NAME,
    isTableFullscreen: ui.isTableFullscreen,
    isHorizontalTable: computed.isHorizontalTable,
    showTotals: ui.showTotals,
    isGroupingEnabled: ui.isGroupingEnabled,
    expandedLevels: outline.expandedLevels,
    outlineRowCounts: outline.rowCounts,
    maxVisibleRows: outline.maxVisibleRows,
    isOutlineCapped: outline.isCapped,
    isVerticalViewAvailable: vertical.isAvailable,
    maxVerticalViewRows: vertical.maxRows,
    showTips: state.showTips,
    fields: state.fields,
    rows: computed.rows,
    verticalColumns: computed.verticalColumns,
    scrollContainerRef: state.tableScrollRef,
    onToggleTotals: actions.toggleTotals,
    onToggleGrouping: actions.toggleGrouping,
    onExpandedLevelsChange: actions.setExpandedLevels,
    onToggleOrientation: actions.toggleOrientation,
    onToggleFullscreen: actions.toggleFullscreen,
    getMappedValue: computed.getMappedValue,
    getRawValue: computed.getMappedRawValue,
    formatFieldTotal: computed.formatFieldTotal,
    getFieldWarning: computed.getFieldWarning,
    isGroupExpanded: actions.isGroupExpanded,
    onToggleGroup: actions.setGroupExpanded,
  }
}
