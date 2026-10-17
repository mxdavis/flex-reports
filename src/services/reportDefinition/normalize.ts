import type { ReportFormula } from '../adapters'
import { sortFormulasByLabel } from '../../utils/reportBuilder'
import {
  DEFAULT_CURRENCY_SYMBOL,
  getDefaultAggregation,
  getDefaultCurrencySymbol,
  getDefaultDisplayType,
} from './displayType'
import {
  REPORT_DEFINITION_VERSION,
  type AggregationMode,
  type DisplayType,
  type ReportDefinition,
  type ReportField,
  type ReportView,
  type SourceColumn,
} from './types'

export const DEFAULT_SHEET_NAME = 'Report'

const DISPLAY_TYPES: DisplayType[] = ['currency', 'number', 'decimal', 'percent', 'date', 'string']
const AGGREGATION_MODES: AggregationMode[] = ['none', 'sum', 'avg', 'count', 'distinct']
const DEFAULT_VIEW: ReportView = { orientation: 'horizontal', showTotals: false, isGroupingEnabled: false, expandedLevels: null }

type UnknownRecord = Record<string, unknown>

function isRecord(value: unknown): value is UnknownRecord {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function asNonEmptyString(value: unknown): string | null {
  return typeof value === 'string' && value.trim().length > 0 ? value : null
}

export function generateDefaultFields(sourceColumns: SourceColumn[]): ReportField[] {
  return sourceColumns.map((column) => {
    const displayType = getDefaultDisplayType(column)
    return {
      id: column.id,
      label: column.label,
      sourceKey: column.key,
      displayType,
      aggregation: getDefaultAggregation(displayType),
      currencySymbol: getDefaultCurrencySymbol(displayType),
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
    : getDefaultDisplayType(sourceByKey.get(sourceKey) ?? { dataType: 'string' })
  const aggregation = AGGREGATION_MODES.includes(raw.aggregation as AggregationMode)
    ? raw.aggregation as AggregationMode
    : getDefaultAggregation(displayType)

  return {
    id,
    label: asNonEmptyString(raw.label) ?? sourceKey,
    sourceKey,
    displayType,
    aggregation,
    currencySymbol: typeof raw.currencySymbol === 'string'
      ? raw.currencySymbol
      : getDefaultCurrencySymbol(displayType),
  }
}

function normalizeFormulas(raw: unknown): ReportFormula[] {
  if (!Array.isArray(raw)) return []
  const seenLabels = new Set<string>()
  const formulas: ReportFormula[] = []
  for (const item of raw) {
    if (!isRecord(item)) continue
    const label = asNonEmptyString(item.label)?.trim()
    const expression = asNonEmptyString(item.expression)?.trim()
    if (!label || !expression || seenLabels.has(label.toLowerCase())) continue
    seenLabels.add(label.toLowerCase())
    formulas.push({ label, expression })
  }
  return sortFormulasByLabel(formulas)
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
    console.error(`[flex-reports] Dropped ${rawFields.length - fields.length} invalid field(s) from reportDefinition.`)
  }

  return {
    version: REPORT_DEFINITION_VERSION,
    sheetName: asNonEmptyString(raw.sheetName) ?? defaults.sheetName,
    currencySymbol: asNonEmptyString(raw.currencySymbol) ?? defaults.currencySymbol,
    fields: fields.length > 0 ? fields : defaults.fields,
    formulas: Array.isArray(raw.formulas) ? normalizeFormulas(raw.formulas) : defaults.formulas,
    view: normalizeView(raw.view),
  }
}
