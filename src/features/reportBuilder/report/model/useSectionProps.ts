import type { EditModeToolbarProps } from '../../components/EditModeToolbar'
import type { SampleRowsSectionProps } from '../../components/SampleRowsSection'
import type { SeedHeaderProps } from '../../components/SeedHeader'
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

export function useReportSettingsProps(): Omit<SeedHeaderProps, 'isCollapsed' | 'onToggleCollapsed'> {
  const { state } = useReportBuilder()
  return {
    sheetName: state.sheetName,
    currencySymbol: state.currencySymbol,
    onSheetNameChange: state.setSheetName,
    onCurrencySymbolChange: state.setCurrencySymbol,
  }
}

export function useTableSectionProps(): SampleRowsSectionProps {
  const { state, computed, actions } = useReportBuilder()
  const { ui } = state
  return {
    sheetName: state.sheetName.trim().length > 0 ? state.sheetName : DEFAULT_SHEET_NAME,
    isTableFullscreen: ui.isTableFullscreen,
    isHorizontalTable: computed.isHorizontalTable,
    showTotals: ui.showTotals,
    isGroupingEnabled: ui.isGroupingEnabled,
    expandedLevels: ui.expandedLevels,
    showTips: state.showTips,
    fields: state.fields,
    previewRows: computed.previewRows,
    verticalColumns: computed.verticalColumns,
    tableScrollRef: state.tableScrollRef,
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
