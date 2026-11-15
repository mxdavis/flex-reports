import { useEffect, useMemo, useReducer, useRef, useState, type Dispatch, type SetStateAction } from 'react'
import { createRecordsDataSource } from '../../../../services/adapters/recordsDataSource'
import type { SeedFormula } from '../../../../services/adapters/types'
import { generateDefaultReportData } from '../../../../services/reportDefinition/storage'
import { DEFAULT_CURRENCY_SYMBOL, DEFAULT_SHEET_NAME, MAX_REPORT_COLUMNS } from '../../config'
import {
  createInitialUiState,
  uiReducer,
} from '../../state/uiState'
import type { ReportBuilderOptions } from '../../types'
import { getNextFormulaLabel, sortFormulasByLabel } from '../../../../utils/reportBuilder'
import type { ChipAggregationMode, DisplayType, ReportData, SourceColumn } from '../../../../services/reportDefinition/types'

export function useReportBuilderState({
  records,
  initialReportDefinition,
  onReportDefinitionChange,
  canEditReport = true,
  initialTableOrientation,
  initialAggregateMode,
  initialEditMode,
}: ReportBuilderOptions) {
  const input = useMemo(() => {
    try {
      const source = createRecordsDataSource(records)
      return { rows: source.getReportRows(), schema: source.getSchema(), error: '' }
    } catch (error) {
      return { rows: [], schema: [], error: error instanceof Error ? error.message : 'Invalid report data.' }
    }
  }, [records])
  const rows = input.rows
  const sourceColumns = useMemo<SourceColumn[]>(() => input.schema, [input.schema])
  const defaults = useMemo(() => generateDefaultReportData(sourceColumns), [sourceColumns])
  const [editedReportData, setEditedReportData] = useState<ReportData | null>(() => {
    return initialReportDefinition?.fields
      ? { version: 4, fields: initialReportDefinition.fields.slice(0, MAX_REPORT_COLUMNS) }
      : null
  })
  const reportData = editedReportData ?? defaults
  const setReportData: Dispatch<SetStateAction<ReportData>> = (update) => {
    setEditedReportData((previous) => typeof update === 'function' ? update(previous ?? defaults) : update)
  }
  const [formulas, setFormulas] = useState<SeedFormula[]>(() => sortFormulasByLabel(initialReportDefinition?.formulas ?? []))
  const [newFormula, setNewFormula] = useState<SeedFormula>(() => ({
    label: getNextFormulaLabel(formulas.map((formula) => formula.label)),
    expression: '',
  }))
  const [formulaError, setFormulaError] = useState('')
  const [editingFormulaError, setEditingFormulaError] = useState('')
  const [addColumnSourceKey, setAddColumnSourceKey] = useState('')
  const [addColumnLabel, setAddColumnLabel] = useState('')
  const [addColumnDisplayType, setAddColumnDisplayType] = useState<DisplayType>('string')
  const [addColumnChipAggregation, setAddColumnChipAggregation] = useState<ChipAggregationMode>('count')
  const [sheetName, setSheetName] = useState(initialReportDefinition?.sheetName ?? DEFAULT_SHEET_NAME)
  const [currencySymbol, setCurrencySymbol] = useState(initialReportDefinition?.currencySymbol ?? DEFAULT_CURRENCY_SYMBOL)

  const [ui, dispatchUi] = useReducer(
    uiReducer,
    { canEditReport, initialEditMode, initialTableOrientation, initialAggregateMode },
    createInitialUiState,
  )

  const tableScrollRef = useRef<HTMLDivElement | null>(null)

  const lastEmittedDefinition = useRef('')
  useEffect(() => {
    if (!onReportDefinitionChange) return
    const definition = { fields: reportData.fields, formulas, sheetName, currencySymbol }
    const signature = JSON.stringify(definition)
    if (lastEmittedDefinition.current === signature) return
    lastEmittedDefinition.current = signature
    onReportDefinitionChange(definition)
  }, [reportData, formulas, sheetName, currencySymbol, onReportDefinitionChange])

  useEffect(() => {
    const tableScrollElement = tableScrollRef.current
    if (!tableScrollElement) return
    tableScrollElement.scrollTo({ left: tableScrollElement.scrollWidth, behavior: 'smooth' })
  }, [reportData.fields.length])

  useEffect(() => {
    if (!ui.isTableFullscreen) return
    function handleEscape(event: KeyboardEvent): void {
      if (event.key === 'Escape') dispatchUi({ type: 'setIsTableFullscreen', value: false })
    }
    window.addEventListener('keydown', handleEscape)
    return () => window.removeEventListener('keydown', handleEscape)
  }, [ui.isTableFullscreen])

  useEffect(() => {
    const nextMax = reportData.fields.length + 1
    const nextPosition = Math.min(Math.max(ui.addColumnPosition, 1), nextMax)
    if (nextPosition !== ui.addColumnPosition) {
      dispatchUi({ type: 'setAddColumnPosition', value: nextPosition })
    }
  }, [reportData.fields.length, ui.addColumnPosition])

  return {
    rows,
    inputError: input.error,
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
  }
}
