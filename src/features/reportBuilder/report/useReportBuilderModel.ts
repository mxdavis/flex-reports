import { useCallback } from 'react'
import type { SeedFormula } from '../../../services/adapters'
import { formatCellValue, getNextFieldId } from '../../../utils/reportBuilder'
import {
  MAX_REPORT_COLUMNS,
} from '../config'
import type { UiAction } from '../state/uiState'
import type { AggregateMode, ReportBuilderAppProps, TableOrientation } from '../types'
import type { DisplayType, ReportField } from '../../../services/reportDefinition/types'
import { buildMappingPanelProps } from './model/buildMappingPanelProps'
import { buildReportBuilderViewProps } from './model/buildReportBuilderViewProps'
import { buildSeedFormulasProps } from './model/buildSeedFormulasProps'
import { useReportBuilderComputed } from './model/useReportBuilderComputed'
import { useReportBuilderHandlers } from './model/useReportBuilderHandlers'
import { useReportBuilderState } from './model/useReportBuilderState'

export function useReportBuilderModel({
  initialTableOrientation,
  initialAggregateMode,
  initialEditMode,
}: Required<ReportBuilderAppProps>) {
  const state = useReportBuilderState({
    initialTableOrientation,
    initialAggregateMode,
    initialEditMode,
  })

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
    aggregateMode,
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
  const setAggregateMode = (value: AggregateMode): void => dispatchUiValue('setAggregateMode', value)
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
    showTotals,
    summaryItems,
    verticalColumns,
    getPreferredDisplayType,
    getMappedValue,
    getAggregatedFieldValue,
  } = useReportBuilderComputed({
    rows: state.rows,
    sourceColumns: state.sourceColumns,
    reportFields: state.reportData.fields,
    formulas: state.formulas,
    currencySymbol: state.currencySymbol,
    tableOrientation,
    aggregateMode,
  })

  const setReportFields = useCallback((updater: (previous: ReportField[]) => ReportField[]) => {
    state.setReportData((previous) => ({ ...previous, fields: updater(previous.fields) }))
  }, [state])

  const setNewFormulaValue = (value: SeedFormula): void => state.setNewFormula(value)
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
    reportFields: state.reportData.fields,
    setReportFields,
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
    state.setReportData((previous) => {
      if (previous.fields.length >= MAX_REPORT_COLUMNS) return previous
      const insertionIndex = Math.min(Math.max(state.ui.addColumnPosition - 1, 0), previous.fields.length)
      const defaultSourceKey = sourceOptions[0] ?? 'workDate'
      const nextSourceKey = state.addColumnSourceKey.trim() || defaultSourceKey
      const nextDisplayType = state.addColumnDisplayType || getPreferredDisplayType(nextSourceKey)
      const nextField: ReportField = {
        id: getNextFieldId(previous.fields.map((field) => field.id)),
        label: state.addColumnLabel.trim() || nextSourceKey,
        sourceKey: nextSourceKey,
        displayType: nextDisplayType,
        chipAggregation: state.addColumnChipAggregation,
        currencySymbol: nextDisplayType === 'currency' ? '$' : '',
      }
      const fields = [...previous.fields]
      fields.splice(insertionIndex, 0, nextField)
      return { ...previous, fields }
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

  const showAuthoring = state.canEditReport && isEditMode
  const mappingPanelProps = buildMappingPanelProps({
    reportFields: state.reportData.fields,
    isAddingColumn,
    addColumnPosition,
    addColumnSourceKey: state.addColumnSourceKey,
    addColumnLabel: state.addColumnLabel,
    addColumnDisplayType: state.addColumnDisplayType,
    addColumnChipAggregation: state.addColumnChipAggregation,
    draggedFieldId,
    dragOverFieldId,
    editingFieldId,
    editingFieldDraft,
    sourceOptions,
    setAddColumnSourceKey: state.setAddColumnSourceKey,
    setAddColumnLabel: state.setAddColumnLabel,
    setAddColumnDisplayType: state.setAddColumnDisplayType,
    setAddColumnChipAggregation: state.setAddColumnChipAggregation,
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
    setReportData: state.setReportData,
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
    canEditReport: state.canEditReport,
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
    isTableFullscreen,
    isHorizontalTable,
    aggregateMode,
    showTotals,
    fields: state.reportData.fields,
    previewRows,
    verticalColumns,
    tableScrollRef: state.tableScrollRef,
    onAggregateModeChange: setAggregateMode,
    onToggleOrientation: () => {
      setTableOrientation((previous) => (previous === 'horizontal' ? 'vertical' : 'horizontal'))
    },
    onToggleFullscreen: () => {
      setIsTableFullscreen((previous) => !previous)
    },
    getMappedValue,
    getAggregatedFieldValue,
    formatValue: (value: number | null, displayType: DisplayType) => {
      if (value === null) return ''
      return formatCellValue(value, displayType, { currencySymbol: state.currencySymbol })
    },
  })
}
