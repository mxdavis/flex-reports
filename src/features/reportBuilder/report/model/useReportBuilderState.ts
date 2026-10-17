import { useEffect, useMemo, useReducer, useRef, useState } from 'react'
import type { ReportFormula, SandboxData } from '../../../../services/adapters'
import { normalizeReportDefinition } from '../../../../services/reportDefinition/normalize'
import { loadSandboxDefinition } from '../../../../services/reportDefinition/storage'
import {
  REPORT_DEFINITION_VERSION,
  type AggregationMode,
  type DisplayType,
  type ReportDefinition,
  type ReportField,
  type SourceColumn,
} from '../../../../services/reportDefinition/types'
import { createInitialUiState, uiReducer } from '../../state/uiState'
import type { ReportBuilderAppProps } from '../../types'
import { getNextFormulaLabel } from '../../../../utils/reportBuilder'
import { resolveReportSource } from './resolveReportSource'
import { useReportSave } from './useReportSave'

export type ReportBuilderStateArgs = Omit<ReportBuilderAppProps, 'initialEditMode'> & {
  initialEditMode: boolean
  // Required in sandbox mode (no rows); see useSandboxData.
  sandboxData?: SandboxData
}

export function useReportBuilderState({
  schema: hostSchema,
  rows: hostRows,
  reportDefinition,
  role = 'editor',
  onSave,
  initialEditMode,
  sandboxData,
}: ReportBuilderStateArgs) {
  const source = useMemo(
    () => resolveReportSource(hostRows, hostSchema, sandboxData),
    [hostRows, hostSchema, sandboxData],
  )
  const { rows, isSandbox } = source
  const sourceColumns = useMemo<SourceColumn[]>(() => source.schema.map((field) => ({ ...field })), [source.schema])

  const [initialDefinition] = useState<ReportDefinition>(() => (isSandbox
    ? loadSandboxDefinition(sourceColumns, source.seedFormulas)
    : normalizeReportDefinition(reportDefinition, sourceColumns)))

  const [fields, setFields] = useState<ReportField[]>(initialDefinition.fields)
  const [formulas, setFormulas] = useState<ReportFormula[]>(initialDefinition.formulas)
  const [sheetName, setSheetName] = useState(initialDefinition.sheetName)
  const [currencySymbol, setCurrencySymbol] = useState(initialDefinition.currencySymbol)
  const [newFormula, setNewFormula] = useState<ReportFormula>(() => ({
    label: getNextFormulaLabel(initialDefinition.formulas.map((formula) => formula.label)),
    expression: '',
  }))
  const [formulaError, setFormulaError] = useState('')
  const [editingFormulaError, setEditingFormulaError] = useState('')
  const [addColumnSourceKey, setAddColumnSourceKey] = useState('')
  const [addColumnLabel, setAddColumnLabel] = useState('')
  const [addColumnDisplayType, setAddColumnDisplayType] = useState<DisplayType>('string')
  const [addColumnAggregation, setAddColumnAggregation] = useState<AggregationMode>('count')

  const [ui, dispatchUi] = useReducer(
    uiReducer,
    { initialEditMode, initialView: initialDefinition.view },
    createInitialUiState,
  )

  const canSave = role === 'editor' && (isSandbox || onSave !== undefined)
  // Authoring tips are for editors only; viewers can explore but never see them.
  const showTips = role === 'editor'
  const isMissingSchema = !isSandbox && hostSchema === undefined
  useEffect(() => {
    if (isMissingSchema) {
      console.warn('[flex-reports] `rows` was passed without `schema`; inferring columns from the first row.')
    }
  }, [isMissingSchema])
  useEffect(() => {
    if (role === 'editor' && !isSandbox && !onSave) {
      console.error('[flex-reports] role="editor" was passed without `onSave`; the Save button is hidden.')
    }
  }, [isSandbox, onSave, role])

  const definition = useMemo<ReportDefinition>(() => ({
    version: REPORT_DEFINITION_VERSION,
    sheetName,
    currencySymbol,
    fields,
    formulas,
    view: {
      orientation: ui.tableOrientation,
      showTotals: ui.showTotals,
      isGroupingEnabled: ui.isGroupingEnabled,
      expandedLevels: ui.expandedLevels,
    },
  }), [currencySymbol, fields, formulas, sheetName, ui.expandedLevels, ui.isGroupingEnabled, ui.showTotals, ui.tableOrientation])

  const saveState = useReportSave({ definition, initialDefinition, canSave, isSandbox, onSave })

  const tableScrollRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    const tableScrollElement = tableScrollRef.current
    if (!tableScrollElement) return
    tableScrollElement.scrollTo({ left: tableScrollElement.scrollWidth, behavior: 'smooth' })
  }, [fields.length])

  useEffect(() => {
    if (!ui.isTableFullscreen) return
    function handleEscape(event: KeyboardEvent): void {
      if (event.key === 'Escape') dispatchUi({ type: 'setIsTableFullscreen', value: false })
    }
    window.addEventListener('keydown', handleEscape)
    return () => window.removeEventListener('keydown', handleEscape)
  }, [ui.isTableFullscreen])

  useEffect(() => {
    const nextMax = fields.length + 1
    const nextPosition = Math.min(Math.max(ui.addColumnPosition, 1), nextMax)
    if (nextPosition !== ui.addColumnPosition) {
      dispatchUi({ type: 'setAddColumnPosition', value: nextPosition })
    }
  }, [fields.length, ui.addColumnPosition])

  return {
    rows,
    sourceColumns,
    fields,
    setFields,
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
    addColumnAggregation,
    setAddColumnAggregation,
    sheetName,
    setSheetName,
    currencySymbol,
    setCurrencySymbol,
    canSave,
    showTips,
    saveState,
    ui,
    dispatchUi,
    tableScrollRef,
  }
}
