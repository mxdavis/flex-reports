import type { ReportFormula } from '../../../services/adapters'
import { getNextFieldId } from '../../../utils/reportBuilder'
import {
  MAX_REPORT_COLUMNS,
} from '../config'
import type { UiAction } from '../state/uiState'
import type { TableOrientation } from '../types'
import type { ReportField } from '../../../services/reportDefinition/types'
import { getDefaultCurrencySymbol } from '../../../services/reportDefinition/displayType'
import { buildMappingPanelProps } from './model/buildMappingPanelProps'
import { buildReportBuilderViewProps } from './model/buildReportBuilderViewProps'
import { buildSeedFormulasProps } from './model/buildSeedFormulasProps'
import { useReportBuilderComputed } from './model/useReportBuilderComputed'
import { useReportBuilderHandlers } from './model/useReportBuilderHandlers'
import { useReportBuilderState, type ReportBuilderStateArgs } from './model/useReportBuilderState'

export function useReportBuilderModel(args: ReportBuilderStateArgs) {
  const state = useReportBuilderState(args)

  const {
    isAddingFormula,
    editingFormulaLabel,
    editingFormula,
    editingFieldId,
    editingFieldDraft,
    addColumnPosition,
    isAddingColumn,
    isEditMode,
    tableOrientation,
    showTotals,
    isGroupingEnabled,
    expandedLevels,
    groupOverrides,
    draggedFieldId,
    dragOverFieldId,
    isTableFullscreen,
  } = state.ui

  type UiValueAction = Extract<UiAction, { value: unknown }>
  const resolveUpdater = <T,>(updater: T | ((previous: T) => T), previous: T): T => {
    return typeof updater === 'function' ? (updater as (previous: T) => T)(previous) : updater
  }
  const dispatchUiValue = <TType extends UiValueAction['type']>(
    type: TType,
    value: Extract<UiValueAction, { type: TType }>['value'],
  ): void => {
    state.dispatchUi({ type, value } as UiValueAction)
  }
  const clearEditingFormulaError = (): void => state.setEditingFormulaError('')

  const setIsEditMode = (updater: boolean | ((previous: boolean) => boolean)): void => {
    dispatchUiValue('setIsEditMode', resolveUpdater(updater, state.ui.isEditMode))
  }
  const setIsAddingFormula = (value: boolean): void => dispatchUiValue('setIsAddingFormula', value)
  const setIsAddingColumn = (value: boolean): void => dispatchUiValue('setIsAddingColumn', value)
  const setAddColumnPosition = (value: number): void => dispatchUiValue('setAddColumnPosition', value)
  const setTableOrientation = (
    updater: TableOrientation | ((previous: TableOrientation) => TableOrientation),
  ): void => {
    dispatchUiValue('setTableOrientation', resolveUpdater(updater, state.ui.tableOrientation))
  }
  const setShowTotals = (value: boolean): void => dispatchUiValue('setShowTotals', value)
  const setExpandedLevels = (value: number | null): void => dispatchUiValue('setExpandedLevels', value)
  // A hand-toggled group wins; otherwise the outline level decides.
  const isGroupExpanded = (level: number, groupKey: string): boolean => {
    return groupOverrides[groupKey] ?? (expandedLevels === null || level < expandedLevels)
  }
  const setIsGroupingEnabled = (value: boolean): void => dispatchUiValue('setIsGroupingEnabled', value)
  const setDraggedFieldId = (value: string | null): void => dispatchUiValue('setDraggedFieldId', value)
  const setDragOverFieldId = (value: string | null): void => dispatchUiValue('setDragOverFieldId', value)
  const setIsTableFullscreen = (updater: boolean | ((previous: boolean) => boolean)): void => {
    dispatchUiValue('setIsTableFullscreen', resolveUpdater(updater, state.ui.isTableFullscreen))
  }
  const {
    sourceOptions,
    formulaTokenOptions,
    previewRows,
    isHorizontalTable,
    summaryItems,
    verticalColumns,
    getPreferredDisplayType,
    getMappedValue,
    getMappedRawValue,
    formatFieldTotal,
  } = useReportBuilderComputed({
    rows: state.rows,
    sourceColumns: state.sourceColumns,
    reportFields: state.fields,
    formulas: state.formulas,
    currencySymbol: state.currencySymbol,
    tableOrientation,
  })

  const setNewFormulaValue = (value: ReportFormula): void => state.setNewFormula(value)
  const {
    patchEditingFieldDraft,
    patchEditingFormulaDraft,
    moveField,
    handleStartEditField,
    handleCancelEditField,
    handleSaveEditField,
    handleAddFormula,
    handleStartEditFormula,
    handleCancelEditFormula,
    handleSaveEditFormula,
  } = useReportBuilderHandlers({
    ui: state.ui,
    dispatchUi: state.dispatchUi,
    reportFields: state.fields,
    setReportFields: state.setFields,
    formulas: state.formulas,
    setFormulas: state.setFormulas,
    newFormula: state.newFormula,
    setNewFormula: setNewFormulaValue,
    getPreferredDisplayType,
    setFormulaError: state.setFormulaError,
    setEditingFormulaError: state.setEditingFormulaError,
    clearEditingFormulaError,
  })

  function handleAddColumnAtPosition(): void {
    state.setFields((previous) => {
      if (previous.length >= MAX_REPORT_COLUMNS) return previous
      const insertionIndex = Math.min(Math.max(state.ui.addColumnPosition - 1, 0), previous.length)
      const nextSourceKey = state.addColumnSourceKey.trim() || sourceOptions[0]
      if (!nextSourceKey) return previous
      const nextDisplayType = state.addColumnDisplayType || getPreferredDisplayType(nextSourceKey)
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
  }

  function handleJumpToSection(sectionId: string): void {
    const section = document.getElementById(sectionId)
    if (!section) {
      return
    }

    section.scrollIntoView({ behavior: 'smooth', block: 'start' })
    window.history.replaceState(null, '', `#${sectionId}`)
  }

  const showAuthoring = isEditMode
  const mappingPanelProps = buildMappingPanelProps({
    showTips: state.showTips,
    reportFields: state.fields,
    isAddingColumn,
    addColumnPosition,
    addColumnSourceKey: state.addColumnSourceKey,
    addColumnLabel: state.addColumnLabel,
    addColumnDisplayType: state.addColumnDisplayType,
    addColumnAggregation: state.addColumnAggregation,
    draggedFieldId,
    dragOverFieldId,
    editingFieldId,
    editingFieldDraft,
    sourceOptions,
    setAddColumnSourceKey: state.setAddColumnSourceKey,
    setAddColumnLabel: state.setAddColumnLabel,
    setAddColumnDisplayType: state.setAddColumnDisplayType,
    setAddColumnAggregation: state.setAddColumnAggregation,
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
    setFields: state.setFields,
  })

  const seedFormulasProps = buildSeedFormulasProps({
    formulas: state.formulas,
    isAddingFormula,
    newFormula: state.newFormula,
    formulaError: state.formulaError,
    editingFormulaLabel,
    editingFormula,
    editingFormulaError: state.editingFormulaError,
    formulaTokenOptions,
    setFormulaError: state.setFormulaError,
    setIsAddingFormula,
    setNewFormula: state.setNewFormula,
    setFormulas: state.setFormulas,
    patchEditingFormulaDraft,
    handleAddFormula,
    handleStartEditFormula,
    handleCancelEditFormula,
    handleSaveEditFormula,
  })

  return buildReportBuilderViewProps({
    showAuthoring,
    summaryItems,
    canSave: state.canSave,
    saveState: state.saveState,
    isEditMode,
    onJumpToSection: handleJumpToSection,
    onToggleEditMode: () => {
      setIsEditMode((previous) => !previous)
      setIsAddingFormula(false)
      setIsAddingColumn(false)
      state.setFormulaError('')
    },
    sheetName: state.sheetName,
    currencySymbol: state.currencySymbol,
    onSheetNameChange: state.setSheetName,
    onCurrencySymbolChange: state.setCurrencySymbol,
    mappingPanelProps,
    seedFormulasProps,
    sampleRowsProps: {
      isTableFullscreen,
      isHorizontalTable,
      showTotals,
      isGroupingEnabled,
      expandedLevels,
      showTips: state.showTips,
      fields: state.fields,
      previewRows,
      verticalColumns,
      tableScrollRef: state.tableScrollRef,
      onToggleTotals: () => setShowTotals(!showTotals),
      onToggleGrouping: () => {
        setIsGroupingEnabled(!state.ui.isGroupingEnabled)
      },
      onExpandedLevelsChange: setExpandedLevels,
      onToggleOrientation: () => {
        if (state.ui.tableOrientation === 'horizontal') {
          setIsGroupingEnabled(false)
          setTableOrientation('vertical')
          return
        }

        setTableOrientation('horizontal')
      },
      onToggleFullscreen: () => {
        setIsTableFullscreen((previous) => !previous)
      },
      getMappedValue,
      getRawValue: getMappedRawValue,
      formatFieldTotal,
      isGroupExpanded,
      onToggleGroup: (groupKey: string, isExpanded: boolean) => {
        state.dispatchUi({ type: 'setGroupExpanded', groupKey, isExpanded })
      },
    },
  })
}
