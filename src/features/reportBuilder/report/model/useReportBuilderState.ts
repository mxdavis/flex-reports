import { useEffect, useMemo, useReducer, useRef, useState } from 'react'
import type { ReportFormula, SandboxData, SchemaField } from '../../../../services/adapters'
import { generateDefaultReportDefinition, isFromNewerVersion, normalizeReportDefinition } from '../../../../services/reportDefinition/normalize'
import { loadSandboxDefinition } from '../../../../services/reportDefinition/storage'
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
  // Set only in sandbox mode, once the sample data has loaded (see useSandboxData).
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
  // The schema is compared by content, so a host passing an inline array
  // doesn't make every render recompute the report.
  const schemaKey = hostSchema ? JSON.stringify(hostSchema) : ''
  const stableSchema = useMemo(() => (schemaKey ? JSON.parse(schemaKey) as SchemaField[] : undefined), [schemaKey])
  const source = useMemo(
    () => resolveReportSource(hostRows, stableSchema, sandboxData),
    [hostRows, stableSchema, sandboxData],
  )
  const { rows, isSandbox } = source
  const sourceColumns: SourceColumn[] = source.schema

  const [initialDefinition, setInitialDefinition] = useState<ReportDefinition>(() => (isSandbox
    ? loadSandboxDefinition(sourceColumns, source.seedFormulas)
    : normalizeReportDefinition(reportDefinition, sourceColumns)))

  const [fields, setFields] = useState<ReportField[]>(initialDefinition.fields)

  // Without a saved definition, the columns are defaults for the schema. If the
  // schema changes while they're untouched (e.g. mounted with empty rows while
  // loading), rebuild them for the new schema and treat that as the starting point.
  const columnsKey = sourceColumns.map((column) => `${column.key}:${column.dataType}`).join('|')
  const [defaultsColumnsKey, setDefaultsColumnsKey] = useState(columnsKey)
  if (columnsKey !== defaultsColumnsKey) {
    setDefaultsColumnsKey(columnsKey)
    const usesDefaults = !isSandbox && reportDefinition === undefined
    if (usesDefaults && JSON.stringify(fields) === JSON.stringify(initialDefinition.fields)) {
      const defaultFields = generateDefaultReportDefinition(sourceColumns).fields
      setFields(defaultFields)
      setInitialDefinition((previous) => ({ ...previous, fields: defaultFields }))
    }
  }
  const [formulas, setFormulas] = useState<ReportFormula[]>(initialDefinition.formulas)
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
  const [isNewerVersion] = useState(() => !isSandbox && isFromNewerVersion(reportDefinition))
  const canSave = role === 'editor' && !isNewerVersion && (isSandbox || onSave !== undefined)
  const saveBlockedReason = role === 'editor' && isNewerVersion
    ? 'This report was saved by a newer version of Flex Reports, so saving is turned off here to keep it from being overwritten.'
    : ''
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

  const saveState = useReportSave({ definition, baseline: initialDefinition, canSave, isSandbox, onSave })

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
