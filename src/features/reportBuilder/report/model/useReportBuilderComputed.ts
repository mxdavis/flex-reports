import { getColumnPath, readFieldPath } from '../../../../services/adapters/fieldPath'
import { getRowKey } from '../../../../services/adapters/recordsDataSource'
import { useCallback, useEffect, useMemo } from 'react'
import { evaluateFormula } from '../../../../services/formula/evaluateFormula'
import { getDefaultDisplayType } from '../../../../services/reportDefinition/displayType'
import { getFormulaError } from '../../../../services/reportDefinition/rules'
import type { ReportRow, ReportFormula } from '../../../../services/adapters'
import type { AggregationMode, DisplayType, ReportField, SourceColumn, TableOrientation } from '../../../../services/reportDefinition/types'
import { DEFAULT_CURRENCY_SYMBOL } from '../../config'
import { formatCellValue, isBlankReportValue, isValidReportDate, parseReportNumber, toReportNumber } from '../../../../utils/reportBuilder'
import { getFormulaReferences } from '../../../../services/formula/formulaReferences'
import { buildSummaryItems } from '../../summaryItems'
import { getTotalDisplayType, isNumericDisplayType } from './fieldTotals'
import { isBlank, type GetFieldValue } from './pivotLayout'

type NonNumbers = { count: number, firstRow: number, firstValue: unknown }

function findNonNumbers(rows: ReportRow[], getValue: (row: ReportRow) => unknown): NonNumbers | undefined {
  let found: NonNumbers | undefined
  rows.forEach((row, index) => {
    const value = getValue(row)
    if (isBlankReportValue(value) || parseReportNumber(value) !== undefined) return
    if (found) found.count += 1
    else found = { count: 1, firstRow: index + 1, firstValue: value }
  })
  return found
}

function describeExample({ firstRow, firstValue }: NonNumbers): string {
  return `row ${firstRow}: ${JSON.stringify(firstValue)}`
}

function describeNonNumbers(nonNumbers: NonNumbers): string {
  const { count } = nonNumbers
  const example = describeExample(nonNumbers)
  return count === 1
    ? `1 value isn't a number (${example}). It's shown as entered, left out of totals, and counted as 0 in formulas.`
    : `${count.toLocaleString('en-US')} values aren't numbers (first in ${example}). They're shown as entered, left out of totals, and counted as 0 in formulas.`
}

// For a formula: a field it uses has values that aren't numbers, like a
// spreadsheet cell a formula relies on that holds text.
function describeFormulaNonNumbers(fieldName: string, nonNumbers: NonNumbers): string {
  const { count } = nonNumbers
  const example = describeExample(nonNumbers)
  return count === 1
    ? `${fieldName} has 1 value that isn't a number (${example}). It's counted as 0.`
    : `${fieldName} has ${count.toLocaleString('en-US')} values that aren't numbers (first in ${example}). They're counted as 0.`
}

// In vertical view each data row becomes a column, headed by its first-column value.
export type VerticalColumn = {
  key: string
  headerValue: string
  row: ReportRow
}

type UseReportBuilderComputedArgs = {
  rows: ReportRow[]
  sourceColumns: SourceColumn[]
  reportFields: ReportField[]
  formulas: ReportFormula[]
  currencySymbol: string
  tableOrientation: TableOrientation
  showTips: boolean
}

export function useReportBuilderComputed({
  rows,
  sourceColumns,
  reportFields,
  formulas,
  currencySymbol,
  tableOrientation,
  showTips,
}: UseReportBuilderComputedArgs) {
  const sourceColumnByKey = useMemo(() => {
    return new Map(sourceColumns.map((column) => [String(column.key), { ...column, path: getColumnPath(column) }]))
  }, [sourceColumns])

  // "%Fee" is always the Fee formula, never a data field: formulas are the
  // user's own, kept apart from the host's data even when names overlap.
  // Each field has one written form (see formatFieldPath), so it's found by that alone.
  const getSourceColumn = useCallback((reference: string) => (
    reference.startsWith('%') ? undefined : sourceColumnByKey.get(reference)
  ), [sourceColumnByKey])

  // A new column's default header: the field's label, or the formula's name.
  const getSourceLabel = (reference: string) => (
    getSourceColumn(reference)?.label ?? (reference.startsWith('%') ? reference.slice(1) : reference)
  )

  const sourceOptions = useMemo(() => {
    const formulaLabels = formulas.map((formula) => `%${formula.label}`)
    return Array
      .from(new Set([...sourceColumns.map((column) => String(column.key)), ...formulaLabels]))
      .sort((left, right) => left.localeCompare(right, undefined, { sensitivity: 'base' }))
  }, [formulas, sourceColumns])

  const formulasByLabel = useMemo(() => {
    const mapped = new Map<string, string>()
    for (const formula of formulas) mapped.set(formula.label.toLowerCase(), formula.expression)
    return mapped
  }, [formulas])

  // A column source names a formula as "%Label".
  const isFormulaSource = useCallback((sourceKey: string) => (
    sourceKey.startsWith('%') && formulasByLabel.has(sourceKey.slice(1).trim().toLowerCase())
  ), [formulasByLabel])

  // Notes for editors about saved formulas that need their attention. Saved
  // formulas are never dropped or renamed: they keep working as far as they
  // can, and the editor decides what to change. A formula sharing a name with a
  // data field keeps working too (%Fee is the formula, Fee the field).
  const formulaNotes = useMemo(() => {
    const fieldNames = new Set(sourceColumns.map((column) => String(column.key).toLowerCase()))
    return formulas.flatMap((formula) => {
      const problem = getFormulaError(formula, { existingLabels: [] })
      if (problem) return [formula.label.trim() ? `Formula "${formula.label}": ${problem}` : `A formula has no label: ${problem}`]
      if (fieldNames.has(formula.label.trim().toLowerCase())) {
        return [`Your data now has a field called ${formula.label}, the same name as your formula. Rename the formula so they don't get mixed up.`]
      }
      return []
    })
  }, [formulas, sourceColumns])

  const formulaTokenOptions = useMemo(() => {
    return Array.from(new Set([
      ...sourceColumns.map((column) => String(column.key)),
      ...formulas.map((formula) => `%${formula.label}`),
    ]))
  }, [formulas, sourceColumns])

  // A column whose source isn't in the data or formulas stays put and renders
  // blank, rather than being silently pointed at another field.
  const missingSourceFields = useMemo(() => reportFields.filter((field) => (
    !getSourceColumn(field.sourceKey) && !isFormulaSource(field.sourceKey)
  )), [isFormulaSource, reportFields, getSourceColumn])

  const missingSourceSummary = missingSourceFields.map((field) => `"${field.label}" → "${field.sourceKey}"`).join(', ')
  useEffect(() => {
    if (missingSourceSummary) {
      console.warn(`[flex-reports] Columns point at sources that aren't in the schema or formulas: ${missingSourceSummary}.`)
    }
  }, [missingSourceSummary])

  // Editors only: viewers can't fix the column, so they just see it blank.
  const getFieldWarning = useCallback((field: ReportField): string | null => {
    if (!showTips || !missingSourceFields.includes(field)) return null
    return `Source "${field.sourceKey}" isn't in the data or formulas. Edit the column to pick another source.`
  }, [missingSourceFields, showTips])

  const isHorizontalTable = tableOrientation === 'horizontal'

  function getPreferredDisplayType(sourceKey: string): DisplayType {
    if (isFormulaSource(sourceKey.trim())) return 'decimal'
    const schemaField = getSourceColumn(sourceKey)
    return getDefaultDisplayType(schemaField)
  }

  const getFormulaValue = useCallback(function getFormulaValue(
    formulaLabel: string,
    cache: Map<string, number>,
    visiting: Set<string>,
    row: ReportRow,
  ): number {
    const label = formulaLabel.toLowerCase()
    if (cache.has(label)) return cache.get(label)!
    if (visiting.has(label)) return Number.NaN
    const expression = formulasByLabel.get(label)
    if (expression === undefined) return Number.NaN
    visiting.add(label)
    const result = evaluateFormula(expression, (reference) => {
      if (reference.startsWith('%')) return getFormulaValue(reference.slice(1), cache, visiting, row)
      const column = getSourceColumn(reference)
      if (column) return toReportNumber(readFieldPath(row, column.path))
      return Number.NaN
    })
    const value = result.ok ? result.value : Number.NaN
    cache.set(label, value)
    visiting.delete(label)
    return value
  }, [formulasByLabel, getSourceColumn])

  // Values are cached per row and source, so each cell's formula and format run
  // once per change of formulas/currency instead of on every render. Caches are
  // rebuilt whenever their inputs change, and rows are keys of a WeakMap so a
  // refetched rows array never holds old data alive.
  const getMappedRawValue = useMemo(() => {
    const cache = new WeakMap<ReportRow, Map<string, unknown>>()
    return (row: ReportRow, sourceKey: string): unknown => {
      const mappedColumn = getSourceColumn(sourceKey)
      if (mappedColumn) return readFieldPath(row, mappedColumn.path)
      if (!isFormulaSource(sourceKey)) return null

      let rowCache = cache.get(row)
      if (!rowCache) {
        rowCache = new Map()
        cache.set(row, rowCache)
      }
      if (rowCache.has(sourceKey)) return rowCache.get(sourceKey)
      const value = getFormulaValue(sourceKey.slice(1).trim(), new Map(), new Set(), row)
      rowCache.set(sourceKey, value)
      return value
    }
  }, [getFormulaValue, getSourceColumn, isFormulaSource])

  // One currency symbol for the whole report.
  const formatOptions = useMemo(() => ({ currencySymbol: currencySymbol.trim() || DEFAULT_CURRENCY_SYMBOL }), [currencySymbol])

  // Number columns read numeric text as numbers; blanks stay blank and other
  // text is kept as entered so it shows (and exports) unchanged.
  const getFieldRawValue = useCallback((row: ReportRow, field: ReportField): unknown => {
    const raw = getMappedRawValue(row, field.sourceKey)
    if (!getSourceColumn(field.sourceKey) || !isNumericDisplayType(field.displayType)) return raw
    if (isBlankReportValue(raw)) return null
    return parseReportNumber(raw) ?? raw
  }, [getMappedRawValue, getSourceColumn])

  // A row's value for a column, formatted for display.
  const getFieldValue = useMemo<GetFieldValue>(() => {
    const cache = new WeakMap<ReportRow, Map<string, string>>()
    return (row, field) => {
      const cacheKey = `${field.sourceKey}\u0000${field.displayType}`
      let rowCache = cache.get(row)
      if (!rowCache) {
        rowCache = new Map()
        cache.set(row, rowCache)
      }
      const cached = rowCache.get(cacheKey)
      if (cached !== undefined) return cached
      const value = formatCellValue(getFieldRawValue(row, field), field.displayType, formatOptions)
      rowCache.set(cacheKey, value)
      return value
    }
  }, [formatOptions, getFieldRawValue])

  const getAggregatedFieldValue = useCallback((
    rowsToAggregate: ReportRow[],
    sourceKey: string,
    mode: AggregationMode,
  ): number | null => {
    if (mode === 'none') return null
    if (mode === 'count') return rowsToAggregate.length
    if (mode === 'distinct') {
      const seen = new Set<string>()
      for (const row of rowsToAggregate) {
        const value = getMappedRawValue(row, sourceKey)
        if (isBlank(value)) continue
        seen.add(`${typeof value}:${String(value)}`)
      }
      return seen.size
    }

    const isSourceColumn = Boolean(getSourceColumn(sourceKey))
    let total = 0
    let count = 0
    for (const row of rowsToAggregate) {
      const raw = getMappedRawValue(row, sourceKey)
      // Blank and non-numeric source values are left out, so they don't lower averages.
      const value = isSourceColumn ? parseReportNumber(raw) : raw
      if (typeof value !== 'number') continue
      if (!Number.isFinite(value)) return Number.NaN
      total += value
      count += 1
    }
    if (count === 0) return null
    if (!Number.isFinite(total)) return Number.NaN
    return mode === 'avg' ? total / count : total
  }, [getMappedRawValue, getSourceColumn])

  // Each column totals by its own aggregation setting, wherever totals appear
  // (summary chips, group totals, grand total), so e.g. a rate can average
  // while hours sum.
  // A column's total as a number (NaN for a broken formula, null for none).
  const getFieldTotal = useCallback((rowsToAggregate: ReportRow[], field: ReportField): number | null => {
    return getAggregatedFieldValue(rowsToAggregate, field.sourceKey, field.aggregation)
  }, [getAggregatedFieldValue])

  const formatFieldTotal = useCallback((rowsToAggregate: ReportRow[], field: ReportField): string => {
    const value = getFieldTotal(rowsToAggregate, field)
    if (value === null) return ''
    if (Number.isNaN(value)) return 'Invalid formula'
    return formatCellValue(value, getTotalDisplayType(field), formatOptions)
  }, [formatOptions, getFieldTotal])

  const verticalColumns = useMemo<VerticalColumn[]>(() => {
    const firstField = reportFields[0]
    // Only built in vertical view: one column object per row is wasted work otherwise.
    if (!firstField || isHorizontalTable) return []
    return rows.map((row) => ({ key: getRowKey(row), headerValue: getFieldValue(row, firstField), row }))
  }, [getFieldValue, isHorizontalTable, rows, reportFields])

  const summaryItems = useMemo(
    () => buildSummaryItems({ fields: reportFields, rows, formatFieldTotal }),
    [formatFieldTotal, reportFields, rows],
  )

  const issues = useMemo(() => {
    const issues: string[] = []
    for (const field of reportFields) {
      if (rows.length === 0) continue
      if (field.displayType === 'date' && rows.some((row) => {
        const value = getMappedRawValue(row, field.sourceKey)
        return !isBlankReportValue(value) && !isValidReportDate(value)
      })) {
        issues.push(`Column ${field.label}: use valid dates. Original values are shown.`)
      }
      const nonNumbers = isNumericDisplayType(field.displayType) && getSourceColumn(field.sourceKey)
        ? findNonNumbers(rows, (row) => getMappedRawValue(row, field.sourceKey))
        : undefined
      if (nonNumbers) issues.push(`Column ${field.label}: ${describeNonNumbers(nonNumbers)}`)
    }
    for (const formula of formulas) {
      // Reuses the per-row values the table already computed.
      if (rows.some((row) => !Number.isFinite(getMappedRawValue(row, `%${formula.label}`) as number))) {
        issues.push(`Formula ${formula.label}: check references, circular dependencies, and arithmetic.`)
      }
      const fieldNames = new Set(getFormulaReferences(formula.expression).map((token) => token.reference.trim()))
      for (const fieldName of fieldNames) {
        const column = getSourceColumn(fieldName)
        const nonNumbers = column && findNonNumbers(rows, (row) => getMappedRawValue(row, fieldName))
        if (nonNumbers) issues.push(`Formula ${formula.label}: ${describeFormulaNonNumbers(fieldName, nonNumbers)}`)
      }
    }
    return issues
  }, [formulas, getMappedRawValue, getSourceColumn, reportFields, rows])

  return {
    issues,
    sourceOptions,
    formulaTokenOptions,
    rows,
    isHorizontalTable,
    summaryItems,
    verticalColumns,
    getPreferredDisplayType,
    getSourceLabel,
    formulaNotes,
    getFieldValue,
    getMappedRawValue,
    getFieldRawValue,
    getFieldTotal,
    formatFieldTotal,
    getFieldWarning,
  }
}
