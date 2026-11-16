import { getRowKey } from '../../../../services/adapters/recordsDataSource'
import { useCallback, useEffect, useMemo } from 'react'
import { evaluateFormula } from '../../../../services/formula/evaluateFormula'
import { getDefaultDisplayType } from '../../../../services/reportDefinition/displayType'
import type { ReportRow, ReportFormula } from '../../../../services/adapters'
import type { AggregationMode, DisplayType, ReportField, SourceColumn, TableOrientation } from '../../../../services/reportDefinition/types'
import { DEFAULT_CURRENCY_SYMBOL } from '../../config'
import { formatCellValue, isValidReportDate, toReportNumber } from '../../../../utils/reportBuilder'
import { buildSummaryItems } from '../../summaryItems'
import { getTotalDisplayType, isNumericDisplayType } from './fieldTotals'
import { isBlank, type GetFieldValue } from './pivotLayout'

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
    return new Map(sourceColumns.map((column) => [String(column.key), column]))
  }, [sourceColumns])

  const sourceOptions = useMemo(() => {
    const formulaLabels = formulas.map((formula) => formula.label)
    return Array
      .from(new Set([...sourceColumns.map((column) => String(column.key)), ...formulaLabels]))
      .sort((left, right) => left.localeCompare(right, undefined, { sensitivity: 'base' }))
  }, [formulas, sourceColumns])

  const formulasByLabel = useMemo(() => {
    const mapped = new Map<string, string>()
    for (const formula of formulas) mapped.set(formula.label.toLowerCase(), formula.expression)
    return mapped
  }, [formulas])

  const formulaTokenOptions = useMemo(() => {
    return Array.from(new Set([
      ...sourceColumns.map((column) => String(column.key)),
      ...formulas.map((formula) => `%${formula.label}`),
    ]))
  }, [formulas, sourceColumns])

  // A column whose source isn't in the data or formulas stays put and renders
  // blank, rather than being silently pointed at another field.
  const missingSourceFields = useMemo(() => reportFields.filter((field) => (
    !sourceColumnByKey.has(field.sourceKey) && !formulasByLabel.has(field.sourceKey.toLowerCase())
  )), [formulasByLabel, reportFields, sourceColumnByKey])

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
    if (formulasByLabel.has(sourceKey.toLowerCase().trim())) return 'decimal'
    const schemaField = sourceColumnByKey.get(sourceKey)
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
      if (sourceColumnByKey.has(reference)) {
        return toReportNumber(Object.hasOwn(row, reference) ? row[reference] : undefined)
      }
      return getFormulaValue(reference, cache, visiting, row)
    })
    const value = result.ok ? result.value : Number.NaN
    cache.set(label, value)
    visiting.delete(label)
    return value
  }, [formulasByLabel, sourceColumnByKey])

  // Values are cached per row and source, so each cell's formula and format run
  // once per change of formulas/currency instead of on every render. Caches are
  // rebuilt whenever their inputs change, and rows are keys of a WeakMap so a
  // refetched rows array never holds old data alive.
  const getMappedRawValue = useMemo(() => {
    const cache = new WeakMap<ReportRow, Map<string, unknown>>()
    return (row: ReportRow, sourceKey: string): unknown => {
      const mappedColumn = sourceColumnByKey.get(sourceKey)
      if (mappedColumn) return Object.hasOwn(row, mappedColumn.key) ? row[mappedColumn.key] : undefined
      if (!formulasByLabel.has(sourceKey.toLowerCase())) return null

      let rowCache = cache.get(row)
      if (!rowCache) {
        rowCache = new Map()
        cache.set(row, rowCache)
      }
      if (rowCache.has(sourceKey)) return rowCache.get(sourceKey)
      const value = getFormulaValue(sourceKey, new Map(), new Set(), row)
      rowCache.set(sourceKey, value)
      return value
    }
  }, [formulasByLabel, getFormulaValue, sourceColumnByKey])

  // One currency symbol for the whole report.
  const formatOptions = useMemo(() => ({ currencySymbol: currencySymbol.trim() || DEFAULT_CURRENCY_SYMBOL }), [currencySymbol])

  const getFieldRawValue = useCallback((row: ReportRow, field: ReportField): unknown => {
    const raw = getMappedRawValue(row, field.sourceKey)
    return sourceColumnByKey.has(field.sourceKey) && isNumericDisplayType(field.displayType)
      ? toReportNumber(raw) : raw
  }, [getMappedRawValue, sourceColumnByKey])

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
      const raw = getFieldRawValue(row, field)
      const value = raw === null && !sourceColumnByKey.has(field.sourceKey) ? ''
        : formatCellValue(raw, field.displayType, formatOptions)
      rowCache.set(cacheKey, value)
      return value
    }
  }, [formatOptions, getFieldRawValue, sourceColumnByKey])

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

    const isSourceColumn = sourceColumnByKey.has(sourceKey)
    let total = 0
    let count = 0
    for (const row of rowsToAggregate) {
      const raw = getMappedRawValue(row, sourceKey)
      const value = isSourceColumn ? toReportNumber(raw) : raw
      if (typeof value !== 'number') continue
      if (!Number.isFinite(value)) return Number.NaN
      total += value
      count += 1
    }
    if (count === 0) return null
    if (!Number.isFinite(total)) return Number.NaN
    return mode === 'avg' ? total / count : total
  }, [getMappedRawValue, sourceColumnByKey])

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
        return value != null && !isValidReportDate(value)
      })) {
        issues.push(`Column ${field.label}: use valid dates. Original values are shown.`)
      }
    }
    for (const formula of formulas) {
      if (rows.some((row) => !Number.isFinite(getFormulaValue(formula.label, new Map(), new Set(), row)))) {
        issues.push(`Formula ${formula.label}: check references, circular dependencies, and arithmetic.`)
      }
    }
    return issues
  }, [formulas, getFormulaValue, getMappedRawValue, reportFields, rows])

  return {
    issues,
    sourceOptions,
    formulaTokenOptions,
    rows,
    isHorizontalTable,
    summaryItems,
    verticalColumns,
    getPreferredDisplayType,
    getFieldValue,
    getMappedRawValue,
    getFieldRawValue,
    getFieldTotal,
    formatFieldTotal,
    getFieldWarning,
  }
}
