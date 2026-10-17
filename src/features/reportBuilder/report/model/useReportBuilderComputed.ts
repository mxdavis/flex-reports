import { useCallback, useEffect, useMemo } from 'react'
import { evaluateFormula } from '../../../../services/formula/evaluateFormula'
import { getDefaultDisplayType } from '../../../../services/reportDefinition/displayType'
import type { ReportRow, ReportFormula } from '../../../../services/adapters'
import type { AggregationMode, DisplayType, ReportField, SourceColumn } from '../../../../services/reportDefinition/types'
import { DEFAULT_CURRENCY_SYMBOL } from '../../config'
import { formatCellValue } from '../../../../utils/reportBuilder'
import { buildSummaryItems } from '../../summaryItems'
import { getTotalDisplayType } from './fieldTotals'
import { isBlank, type GetFieldValue } from './pivotLayout'

function buildBaseFormulaContext(row: ReportRow): Record<string, number> {
  const context: Record<string, number> = {}
  for (const [key, value] of Object.entries(row)) {
    if (typeof value === 'number' && Number.isFinite(value)) context[key] = value
  }
  return context
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
  tableOrientation: 'horizontal' | 'vertical'
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
    return getDefaultDisplayType(schemaField ?? { dataType: 'string' })
  }

  const getFormulaValue = useCallback(function getFormulaValue(
    formulaLabel: string,
    cache: Map<string, number>,
    visiting: Set<string>,
    context: Record<string, number>,
  ): number {
    const normalizedFormulaLabel = formulaLabel.toLowerCase()
    const cached = cache.get(normalizedFormulaLabel)
    if (cached !== undefined) return cached
    if (visiting.has(normalizedFormulaLabel)) return Number.NaN

    const expression = formulasByLabel.get(normalizedFormulaLabel)
    if (!expression) return Number.NaN

    visiting.add(normalizedFormulaLabel)
    for (const dependency of formulasByLabel.keys()) {
      if (dependency === normalizedFormulaLabel || context[dependency] !== undefined) continue
      context[dependency] = getFormulaValue(dependency, cache, visiting, context)
    }

    const result = evaluateFormula(expression, context)
    const value = result.ok ? result.value : Number.NaN
    cache.set(normalizedFormulaLabel, value)
    context[formulaLabel] = value
    context[normalizedFormulaLabel] = value
    visiting.delete(normalizedFormulaLabel)
    return value
  }, [formulasByLabel])

  // Values are cached per row and source, so each cell's formula and format run
  // once per change of formulas/currency instead of on every render. Caches are
  // rebuilt whenever their inputs change, and rows are keys of a WeakMap so a
  // refetched rows array never holds old data alive.
  const getMappedRawValue = useMemo(() => {
    const cache = new WeakMap<ReportRow, Map<string, unknown>>()
    return (row: ReportRow, sourceKey: string): unknown => {
      const mappedColumn = sourceColumnByKey.get(sourceKey)
      if (mappedColumn) return row[mappedColumn.key]
      if (!formulasByLabel.has(sourceKey.toLowerCase())) return null

      let rowCache = cache.get(row)
      if (!rowCache) {
        rowCache = new Map()
        cache.set(row, rowCache)
      }
      if (rowCache.has(sourceKey)) return rowCache.get(sourceKey)
      const value = getFormulaValue(sourceKey, new Map(), new Set(), buildBaseFormulaContext(row))
      rowCache.set(sourceKey, value)
      return value
    }
  }, [formulasByLabel, getFormulaValue, sourceColumnByKey])

  // One currency symbol for the whole report.
  const formatOptions = useMemo(() => ({ currencySymbol: currencySymbol.trim() || DEFAULT_CURRENCY_SYMBOL }), [currencySymbol])

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
      const value = formatCellValue(getMappedRawValue(row, field.sourceKey), field.displayType, formatOptions)
      rowCache.set(cacheKey, value)
      return value
    }
  }, [formatOptions, getMappedRawValue])

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
      const value = getMappedRawValue(row, sourceKey)
      if (typeof value !== 'number') continue
      // Formula results keep NaN so totals surface broken formulas.
      if (Number.isNaN(value)) {
        if (isSourceColumn) continue
        return Number.NaN
      }
      if (!Number.isFinite(value)) continue
      total += value
      count += 1
    }
    if (count === 0) return null
    return mode === 'avg' ? total / count : total
  }, [getMappedRawValue, sourceColumnByKey])

  // Each column totals by its own aggregation setting, wherever totals appear
  // (summary chips, group totals, grand total), so e.g. a rate can average
  // while hours sum.
  const formatFieldTotal = useCallback((rowsToAggregate: ReportRow[], field: ReportField): string => {
    const value = getAggregatedFieldValue(rowsToAggregate, field.sourceKey, field.aggregation)
    if (value === null) return ''
    if (Number.isNaN(value)) return 'Invalid formula'
    return formatCellValue(value, getTotalDisplayType(field), formatOptions)
  }, [formatOptions, getAggregatedFieldValue])

  const verticalColumns = useMemo<VerticalColumn[]>(() => {
    const firstField = reportFields[0]
    // Only built in vertical view: one column object per row is wasted work otherwise.
    if (!firstField || isHorizontalTable) return []
    return rows.map((row) => ({ key: row.id, headerValue: getFieldValue(row, firstField), row }))
  }, [getFieldValue, isHorizontalTable, rows, reportFields])

  const summaryItems = useMemo(
    () => buildSummaryItems({ fields: reportFields, rows, formatFieldTotal }),
    [formatFieldTotal, reportFields, rows],
  )

  return {
    sourceOptions,
    formulaTokenOptions,
    rows,
    isHorizontalTable,
    summaryItems,
    verticalColumns,
    getPreferredDisplayType,
    getFieldValue,
    getMappedRawValue,
    formatFieldTotal,
    getFieldWarning,
  }
}
