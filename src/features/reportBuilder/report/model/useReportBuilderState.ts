import { useEffect, useMemo, useReducer, useRef, useState } from 'react'
import type { ReportFormula, SchemaField } from '../../../../services/adapters'
import { getRepeatedFormulaNames, isFromNewerVersion, normalizeReportDefinition } from '../../../../services/reportDefinition/normalize'
import {
  REPORT_DEFINITION_VERSION,
  type ReportDefinition,
  type ReportField,
  type SourceColumn,
} from '../../../../services/reportDefinition/types'
import { createInitialUiState, uiReducer } from '../../state/uiState'
import type { ReportBuilderAppProps } from '../../types'
import { getNextSequencedName } from '../../../../utils/reportBuilder'
import { resolveReportSource } from './resolveReportSource'
import { useReportSave } from './useReportSave'

export type ReportBuilderStateArgs = Omit<ReportBuilderAppProps, 'initialEditMode'> & {
  initialEditMode: boolean
}

export function useReportBuilderState({
  schema: hostSchema,
  rows: hostRows,
  reportDefinition,
  role = 'editor',
  onSave,
  initialEditMode,
}: ReportBuilderStateArgs) {
  // The schema is compared by content, so a host passing an inline array
  // doesn't make every render recompute the report.
  const schemaKey = hostSchema ? JSON.stringify(hostSchema) : ''
  const stableSchema = useMemo(() => (schemaKey ? JSON.parse(schemaKey) as SchemaField[] : undefined), [schemaKey])
  const source = useMemo(
    () => resolveReportSource(hostRows, stableSchema),
    [hostRows, stableSchema],
  )
  const { rows } = source
  useEffect(() => {
    if (source.error) console.error(`[flex-reports] ${source.error}`)
  }, [source.error])
  const sourceColumns: SourceColumn[] = source.schema

  const [initialDefinition] = useState<ReportDefinition>(() => normalizeReportDefinition(reportDefinition, sourceColumns))

  const [fields, setFields] = useState<ReportField[]>(initialDefinition.fields)
  const [formulas, setFormulas] = useState<ReportFormula[]>(initialDefinition.formulas)
  // Shown to everyone: only a host can pass these in, and its developer needs to see it.
  const [definitionIssues] = useState(() => getRepeatedFormulaNames(reportDefinition)
    .map((label) => `Can't have two formulas with the same name: "${label}".`))
  const [sheetName, setSheetName] = useState(initialDefinition.sheetName)
  const [currencySymbol, setCurrencySymbol] = useState(initialDefinition.currencySymbol)
  const [newFormula, setNewFormula] = useState<ReportFormula>(() => ({
    label: getNextSequencedName('formula', initialDefinition.formulas.map((formula) => formula.label)),
    expression: '',
  }))
  const [formulaError, setFormulaError] = useState('')
  const [editingFormulaError, setEditingFormulaError] = useState('')

  const [ui, dispatchUi] = useReducer(
    uiReducer,
    { initialEditMode, initialView: initialDefinition.view },
    createInitialUiState,
  )

  // A report saved by a newer Flex Reports is shown read-only, so saving from
  // this older version can't overwrite fields it doesn't understand.
  const [isNewerVersion] = useState(() => isFromNewerVersion(reportDefinition))
  const canSave = role === 'editor' && !isNewerVersion && onSave !== undefined
  const saveBlockedReason = role === 'editor' && isNewerVersion
    ? 'This report was saved by a newer version of Flex Reports, so saving is turned off here to keep it from being overwritten.'
    : ''
  // Authoring tips are for editors only; viewers can explore but never see them.
  const showTips = role === 'editor'
  useEffect(() => {
    if (role === 'editor' && !onSave) {
      console.error('[flex-reports] role="editor" was passed without `onSave`; the Save button is hidden.')
    }
  }, [onSave, role])

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

  const saveState = useReportSave({ definition, baseline: initialDefinition, canSave, onSave })

  const tableScrollRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    const tableScrollElement = tableScrollRef.current
    if (!tableScrollElement) return
    tableScrollElement.scrollTo({ left: tableScrollElement.scrollWidth, behavior: 'smooth' })
  }, [fields.length])

  useEffect(() => {
    if (!ui.isTableFullscreen) return
    function handleEscape(event: KeyboardEvent): void {
      if (event.key === 'Escape') dispatchUi({ type: 'set', changes: { isTableFullscreen: false } })
    }
    window.addEventListener('keydown', handleEscape)
    return () => window.removeEventListener('keydown', handleEscape)
  }, [ui.isTableFullscreen])

  return {
    sourceError: source.error,
    // Getting started is for setting up a new report, so it goes once one is saved with columns.
    showGettingStarted: !saveState.hasSavedColumns,
    definitionIssues,
    skippedFields: source.skippedFields,
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
    sheetName,
    setSheetName,
    currencySymbol,
    setCurrencySymbol,
    canSave,
    saveBlockedReason,
    showTips,
    saveState,
    ui,
    dispatchUi,
    tableScrollRef,
  }
}
