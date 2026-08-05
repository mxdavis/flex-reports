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
  const {
    rows,
    sourceColumns,
    reportData,
    setReportData,
    formulas,
    setFormulas,
    newFormula,
    setNewFormula,
    formulaError,
    setFormulaError,
    editingFormulaError,
    setEditingFormulaError,
    addColumnSourceKey,
    setAddColumnSourceKey,
    addColumnLabel,
    setAddColumnLabel,
    addColumnDisplayType,
    setAddColumnDisplayType,
    addColumnChipAggregation,
    setAddColumnChipAggregation,
    sheetName,
    setSheetName,
    currencySymbol,
    setCurrencySymbol,
    canEditReport,
    ui,
    dispatchUi,
    tableScrollRef,
  } = useReportBuilderState({
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
  } = ui

  type UiValueAction = Extract<UiAction, { value: unknown }>
  const resolveUpdater = <T,>(updater: T | ((previous: T) => T), previous: T): T => {
    return typeof updater === 'function' ? (updater as (previous: T) => T)(previous) : updater
  }
  const dispatchUiValue = <TType extends UiValueAction['type']>(
    type: TType,
    value: Extract<UiValueAction, { type: TType }>['value'],
  ): void => {
    dispatchUi({ type, value } as UiValueAction)
  }
  const clearEditingFormulaError = (): void => setEditingFormulaError('')

  const setIsEditMode = (updater: boolean | ((previous: boolean) => boolean)): void => {
    dispatchUiValue('setIsEditMode', resolveUpdater(updater, ui.isEditMode))
  }
  const setIsAddingFormula = (value: boolean): void => dispatchUiValue('setIsAddingFormula', value)
  const setIsAddingColumn = (value: boolean): void => dispatchUiValue('setIsAddingColumn', value)
  const setAddColumnPosition = (value: number): void => dispatchUiValue('setAddColumnPosition', value)
  const setTableOrientation = (
    updater: TableOrientation | ((previous: TableOrientation) => TableOrientation),
  ): void => {
    dispatchUiValue('setTableOrientation', resolveUpdater(updater, ui.tableOrientation))
  }
  const setAggregateMode = (value: AggregateMode): void => dispatchUiValue('setAggregateMode', value)
  const setDraggedFieldId = (value: string | null): void => dispatchUiValue('setDraggedFieldId', value)
  const setDragOverFieldId = (value: string | null): void => dispatchUiValue('setDragOverFieldId', value)
  const setIsTableFullscreen = (updater: boolean | ((previous: boolean) => boolean)): void => {
    dispatchUiValue('setIsTableFullscreen', resolveUpdater(updater, ui.isTableFullscreen))
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
    rows,
    sourceColumns,
    reportFields: reportData.fields,
    formulas,
    currencySymbol,
    tableOrientation,
    aggregateMode,
  })

  const setReportFields = useCallback((updater: (previous: ReportField[]) => ReportField[]) => {
    setReportData((previous) => ({ ...previous, fields: updater(previous.fields) }))
  }, [setReportData])

  const setNewFormulaValue = (value: SeedFormula): void => setNewFormula(value)
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
    ui,
    dispatchUi,
    reportFields: reportData.fields,
    setReportFields,
    formulas,
    setFormulas,
    newFormula,
    setNewFormula: setNewFormulaValue,
    getPreferredDisplayType,
    setFormulaError,
    setEditingFormulaError,
    clearEditingFormulaError,
  })

  function handleAddColumnAtPosition(): void {
    setReportData((previous) => {
      if (previous.fields.length >= MAX_REPORT_COLUMNS) return previous
      const insertionIndex = Math.min(Math.max(ui.addColumnPosition - 1, 0), previous.fields.length)
      const defaultSourceKey = sourceOptions[0] ?? 'workDate'
      const nextSourceKey = addColumnSourceKey.trim() || defaultSourceKey
      const nextDisplayType = addColumnDisplayType || getPreferredDisplayType(nextSourceKey)
      const nextField: ReportField = {
        id: getNextFieldId(previous.fields.map((field) => field.id)),
        label: addColumnLabel.trim() || nextSourceKey,
        sourceKey: nextSourceKey,
        displayType: nextDisplayType,
        chipAggregation: addColumnChipAggregation,
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

  const showAuthoring = canEditReport && isEditMode
  const mappingPanelProps = buildMappingPanelProps({
    reportFields: reportData.fields,
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
  })

  const seedFormulasProps = buildSeedFormulasProps({
    formulas,
    isAddingFormula,
    newFormula,
    formulaError,
    editingFormulaLabel,
    editingFormula,
    editingFormulaError,
    formulaTokenOptions,
    setFormulaError,
    setIsAddingFormula,
    setNewFormula,
    setFormulas,
    patchEditingFormulaDraft,
    handleAddFormula,
    handleStartEditFormula,
    handleCancelEditFormula,
    handleSaveEditFormula,
  })

  return buildReportBuilderViewProps({
    showAuthoring,
    summaryItems,
    canEditReport,
    isEditMode,
    onJumpToSection: handleJumpToSection,
    onToggleEditMode: () => {
      setIsEditMode((previous) => !previous)
      setIsAddingFormula(false)
      setIsAddingColumn(false)
      setFormulaError('')
    },
    sheetName,
    currencySymbol,
    onSheetNameChange: setSheetName,
    onCurrencySymbolChange: setCurrencySymbol,
    mappingPanelProps,
    seedFormulasProps,
    isTableFullscreen,
    isHorizontalTable,
    aggregateMode,
    showTotals,
    fields: reportData.fields,
    previewRows,
    verticalColumns,
    tableScrollRef,
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
      return formatCellValue(value, displayType, { currencySymbol })
    },
  })
}
