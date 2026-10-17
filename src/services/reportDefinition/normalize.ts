import type { ReportFormula } from '../adapters'
import { getNextSequencedName, sortFormulasByLabel } from '../../utils/reportBuilder'
import { getFormulaError, MAX_FORMULAS, MAX_REPORT_COLUMNS } from './rules'
import {
  DEFAULT_CURRENCY_SYMBOL,
  getDefaultAggregation,
  getDefaultDisplayType,
} from './displayType'
import {
  AGGREGATION_MODES,
  DISPLAY_TYPES,
  REPORT_DEFINITION_VERSION,
  type AggregationMode,
  type DisplayType,
  type ReportDefinition,
  type ReportField,
  type ReportView,
  type SourceColumn,
} from './types'

export const DEFAULT_SHEET_NAME = 'Report'

const DEFAULT_VIEW: ReportView = { orientation: 'horizontal', showTotals: false, isGroupingEnabled: false, expandedLevels: null }

type UnknownRecord = Record<string, unknown>

function isRecord(value: unknown): value is UnknownRecord {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function asNonEmptyString(value: unknown): string | null {
  return typeof value === 'string' && value.trim().length > 0 ? value : null
}

function generateDefaultFields(sourceColumns: SourceColumn[]): ReportField[] {
  return sourceColumns.map((column) => {
    const displayType = getDefaultDisplayType(column)
    return {
      id: column.id,
      label: column.label,
      sourceKey: column.key,
      displayType,
      aggregation: getDefaultAggregation(displayType),
    }
  })
}

export function generateDefaultReportDefinition(
  sourceColumns: SourceColumn[],
  formulas: ReportFormula[] = [],
): ReportDefinition {
  return {
    version: REPORT_DEFINITION_VERSION,
    sheetName: DEFAULT_SHEET_NAME,
    currencySymbol: DEFAULT_CURRENCY_SYMBOL,
    fields: generateDefaultFields(sourceColumns),
    // Sorted here, the one place definitions are built, so the saved baseline
    // matches the builder's (sorted) state and a fresh report isn't "unsaved".
    formulas: sortFormulasByLabel(formulas),
    view: { ...DEFAULT_VIEW },
  }
}

function normalizeField(raw: unknown, sourceByKey: Map<string, SourceColumn>): ReportField | null {
  if (!isRecord(raw)) return null
  const id = asNonEmptyString(raw.id)
  const sourceKey = asNonEmptyString(raw.sourceKey)
  if (!id || !sourceKey) return null

  const displayType = DISPLAY_TYPES.includes(raw.displayType as DisplayType)
    ? raw.displayType as DisplayType
    : getDefaultDisplayType(sourceByKey.get(sourceKey))
  const aggregation = AGGREGATION_MODES.includes(raw.aggregation as AggregationMode)
    ? raw.aggregation as AggregationMode
    : getDefaultAggregation(displayType)

  return {
    id,
    label: asNonEmptyString(raw.label) ?? sourceKey,
    sourceKey,
    displayType,
    aggregation,
  }
}

function logRepair(message: string): void {
  console.error(`[flex-reports] ${message}`)
}

// Keeps the formulas the editor would accept (see getFormulaError), up to
// MAX_FORMULAS, and logs each one it drops.
function normalizeFormulas(raw: unknown[], fieldKeys: string[]): ReportFormula[] {
  const formulas: ReportFormula[] = []
  for (const item of raw) {
    const formula = {
      label: isRecord(item) && typeof item.label === 'string' ? item.label.trim() : '',
      expression: isRecord(item) && typeof item.expression === 'string' ? item.expression.trim() : '',
    }
    const error = getFormulaError(formula, { existingLabels: formulas.map((kept) => kept.label), fieldKeys })
    if (error) {
      logRepair(`Dropped formula "${formula.label}" from reportDefinition: ${error}`)
      continue
    }
    if (formulas.length >= MAX_FORMULAS) {
      logRepair(`Dropped formula "${formula.label}" from reportDefinition: more than ${MAX_FORMULAS} formulas.`)
      continue
    }
    formulas.push(formula)
  }
  return sortFormulasByLabel(formulas)
}

// Gives repeated column ids a fresh one (the editor finds columns by id) and
// keeps at most MAX_REPORT_COLUMNS columns.
function repairFields(fields: ReportField[]): ReportField[] {
  if (fields.length > MAX_REPORT_COLUMNS) {
    logRepair(`Dropped ${fields.length - MAX_REPORT_COLUMNS} column(s) from reportDefinition: more than ${MAX_REPORT_COLUMNS} columns.`)
  }
  const seenIds = new Set<string>()
  return fields.slice(0, MAX_REPORT_COLUMNS).map((field) => {
    if (!seenIds.has(field.id)) {
      seenIds.add(field.id)
      return field
    }
    const id = getNextSequencedName('field-', [...seenIds])
    seenIds.add(id)
    logRepair(`Column "${field.label}" repeated id "${field.id}"; gave it id "${id}".`)
    return { ...field, id }
  })
}

function normalizeView(raw: unknown): ReportView {
  if (!isRecord(raw)) return { ...DEFAULT_VIEW }
  return {
    orientation: raw.orientation === 'vertical' ? 'vertical' : 'horizontal',
    showTotals: raw.showTotals === true,
    isGroupingEnabled: raw.isGroupingEnabled === true,
    expandedLevels: Number.isInteger(raw.expandedLevels) && (raw.expandedLevels as number) >= 0
      ? raw.expandedLevels as number
      : null,
  }
}

// Accepts anything (a host DB blob, parsed localStorage) and returns a valid
// definition. Invalid parts fall back to schema-driven defaults, with a log.
export function normalizeReportDefinition(
  raw: unknown,
  sourceColumns: SourceColumn[],
  fallbackFormulas: ReportFormula[] = [],
): ReportDefinition {
  const defaults = generateDefaultReportDefinition(sourceColumns, fallbackFormulas)
  if (!isRecord(raw)) {
    if (raw !== undefined && raw !== null) {
      console.error('[flex-reports] reportDefinition must be an object; using defaults.', raw)
    }
    return defaults
  }

  if (raw.version !== REPORT_DEFINITION_VERSION) {
    console.error(
      `[flex-reports] Unsupported reportDefinition version "${String(raw.version)}" `
      + `(expected ${REPORT_DEFINITION_VERSION}); using defaults.`,
    )
    return defaults
  }

  const sourceByKey = new Map(sourceColumns.map((column) => [column.key, column]))
  const rawFields = Array.isArray(raw.fields) ? raw.fields : []
  const fields = rawFields
    .map((field) => normalizeField(field, sourceByKey))
    .filter((field): field is ReportField => field !== null)
  if (fields.length < rawFields.length) {
    logRepair(`Dropped ${rawFields.length - fields.length} invalid field(s) from reportDefinition.`)
  }
  const fieldKeys = sourceColumns.map((column) => column.key)

  return {
    version: REPORT_DEFINITION_VERSION,
    sheetName: asNonEmptyString(raw.sheetName) ?? defaults.sheetName,
    currencySymbol: asNonEmptyString(raw.currencySymbol) ?? defaults.currencySymbol,
    fields: fields.length > 0 ? repairFields(fields) : defaults.fields,
    formulas: Array.isArray(raw.formulas) ? normalizeFormulas(raw.formulas, fieldKeys) : defaults.formulas,
    view: normalizeView(raw.view),
  }
}
