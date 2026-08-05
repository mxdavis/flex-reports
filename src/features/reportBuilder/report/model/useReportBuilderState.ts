import { useEffect, useMemo, useReducer, useRef, useState } from 'react'
import {
  getBillingSeed,
  getReportRows,
  getSchema,
} from '../../../../services/adapters'
import type { SeedFormula } from '../../../../services/adapters'
import {
  loadFormulaData,
  saveFormulaData,
} from '../../../../services/reportDefinition/formulaStorage'
import {
  generateDefaultReportData,
  loadReportData,
  saveReportData,
} from '../../../../services/reportDefinition/storage'
import {
  CURRENCY_SYMBOL_STORAGE_KEY,
  DEFAULT_CURRENCY_SYMBOL,
  DEFAULT_SHEET_NAME,
  SHEET_NAME_STORAGE_KEY,
} from '../../config'
import {
  createInitialUiState,
  uiReducer,
} from '../../state/uiState'
import type { ReportBuilderAppProps } from '../../types'
import { getNextFormulaLabel, sortFormulasByLabel } from '../../../../utils/reportBuilder'
import type { ChipAggregationMode, DisplayType, ReportData, SourceColumn } from '../../../../services/reportDefinition/types'

export function useReportBuilderState({
  initialTableOrientation,
  initialAggregateMode,
  initialEditMode,
}: Required<ReportBuilderAppProps>) {
  const seed = useMemo(() => getBillingSeed(), [])
  const schema = useMemo(() => getSchema(), [])
  const rows = useMemo(() => getReportRows(), [])
  const canEditReport = import.meta.env.VITE_CAN_EDIT_REPORT !== 'false'

  const sourceColumns = useMemo<SourceColumn[]>(() => {
    return schema.map((field) => ({
      id: field.id,
      key: field.key,
      label: field.label,
      dataType: field.dataType,
    }))
  }, [schema])

  const [reportData, setReportData] = useState<ReportData>(() => loadReportData(sourceColumns))
  const [formulas, setFormulas] = useState<SeedFormula[]>(() => sortFormulasByLabel(loadFormulaData(seed.formulas)))
  const [newFormula, setNewFormula] = useState<SeedFormula>(() => ({
    label: getNextFormulaLabel(seed.formulas.map((formula) => formula.label)),
    expression: '{{hours}} * {{rate}}',
  }))
  const [formulaError, setFormulaError] = useState('')
  const [editingFormulaError, setEditingFormulaError] = useState('')
  const [addColumnSourceKey, setAddColumnSourceKey] = useState('')
  const [addColumnLabel, setAddColumnLabel] = useState('')
  const [addColumnDisplayType, setAddColumnDisplayType] = useState<DisplayType>('string')
  const [addColumnChipAggregation, setAddColumnChipAggregation] = useState<ChipAggregationMode>('count')
  const [sheetName, setSheetName] = useState(() => {
    if (typeof window === 'undefined') return DEFAULT_SHEET_NAME
    try {
      const saved = window.localStorage.getItem(SHEET_NAME_STORAGE_KEY)
      if (!saved) return DEFAULT_SHEET_NAME
      return saved.trim().length > 0 ? saved : DEFAULT_SHEET_NAME
    } catch {
      return DEFAULT_SHEET_NAME
    }
  })
  const [currencySymbol, setCurrencySymbol] = useState(() => {
    if (typeof window === 'undefined') return DEFAULT_CURRENCY_SYMBOL
    try {
      const saved = window.localStorage.getItem(CURRENCY_SYMBOL_STORAGE_KEY)
      if (!saved || saved.trim().length === 0) return DEFAULT_CURRENCY_SYMBOL
      return saved
    } catch {
      return DEFAULT_CURRENCY_SYMBOL
    }
  })

  const [ui, dispatchUi] = useReducer(
    uiReducer,
    { canEditReport, initialEditMode, initialTableOrientation, initialAggregateMode },
    createInitialUiState,
  )

  const tableScrollRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    setReportData((previous) => {
      const defaults = generateDefaultReportData(sourceColumns)
      const safeSourceKeys = new Set(
        [...sourceColumns.map((column) => String(column.key)), ...formulas.map((formula) => formula.label)]
          .map((key) => key.toLowerCase()),
      )
      const fields = previous.fields.map((field, index) => {
        if (safeSourceKeys.has(field.sourceKey.toLowerCase())) return field
        return {
          ...field,
          sourceKey: defaults.fields[index]?.sourceKey ?? defaults.fields[0].sourceKey,
        }
      })
      return { version: 4, fields }
    })
  }, [formulas, sourceColumns])

  useEffect(() => {
    saveReportData(reportData)
  }, [reportData])

  useEffect(() => {
    saveFormulaData(formulas)
  }, [formulas])

  useEffect(() => {
    if (typeof window === 'undefined') return
    try {
      window.localStorage.setItem(SHEET_NAME_STORAGE_KEY, sheetName)
    } catch {
      // Ignore storage write failures in private mode/full storage.
    }
  }, [sheetName])

  useEffect(() => {
    if (typeof window === 'undefined') return
    try {
      window.localStorage.setItem(CURRENCY_SYMBOL_STORAGE_KEY, currencySymbol)
    } catch {
      // Ignore storage write failures in private mode/full storage.
    }
  }, [currencySymbol])

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
