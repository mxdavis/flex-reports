import { useCallback, useMemo } from 'react'
import { evaluateFormula } from '../../../../services/formula/evaluateFormula'
import { getDefaultDisplayType } from '../../../../services/reportDefinition/displayType'
import type { ReportRow, ReportFormula } from '../../../../services/adapters'
import type { AggregationMode, DisplayType, ReportField, SourceColumn } from '../../../../services/reportDefinition/types'
import { DEFAULT_CURRENCY_SYMBOL } from '../../config'
import { formatCellValue } from '../../../../utils/reportBuilder'
import { buildSummaryItems } from '../../summaryItems'
import { getTotalDisplayType } from './fieldTotals'

type UseReportBuilderComputedArgs = {
  rows: ReportRow[]
  sourceColumns: SourceColumn[]
  reportFields: ReportField[]
  formulas: ReportFormula[]
  currencySymbol: string
  tableOrientation: 'horizontal' | 'vertical'
}

export function useReportBuilderComputed({
  rows,
  sourceColumns,
  reportFields,
  formulas,
  currencySymbol,
  tableOrientation,
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

  const previewRows = rows
  const isHorizontalTable = tableOrientation === 'horizontal'

  function getPreferredDisplayType(sourceKey: string): DisplayType {
    if (formulasByLabel.has(sourceKey.toLowerCase().trim())) return 'decimal'
    const schemaField = sourceColumnByKey.get(sourceKey)
    return getDefaultDisplayType(schemaField ?? { dataType: 'string' })
  }

  function buildBaseFormulaContext(row: ReportRow): Record<string, number> {
    const context: Record<string, number> = {}
    for (const [key, value] of Object.entries(row)) {
      if (typeof value === 'number' && Number.isFinite(value)) context[key] = value
    }
    return context
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

  const getMappedRawValue = useCallback((row: ReportRow, sourceKey: string): unknown => {
    const mappedColumn = sourceColumnByKey.get(sourceKey)
    if (mappedColumn) return row[mappedColumn.key]

    if (!formulasByLabel.has(sourceKey.toLowerCase())) return null
    const context = buildBaseFormulaContext(row)
    return getFormulaValue(sourceKey, new Map(), new Set(), context)
  }, [formulasByLabel, getFormulaValue, sourceColumnByKey])

  const resolveCurrencySymbol = useCallback((displayType: DisplayType, localCurrencySymbol?: string) => {
    return displayType === 'currency'
      ? (currencySymbol.trim() || localCurrencySymbol?.trim() || DEFAULT_CURRENCY_SYMBOL)
      : undefined
  }, [currencySymbol])

  const getMappedValue = useCallback((
    row: ReportRow,
    sourceKey: string,
    displayType: DisplayType,
    localCurrencySymbol?: string,
  ): string => {
    const resolvedCurrencySymbol = resolveCurrencySymbol(displayType, localCurrencySymbol)
    return formatCellValue(getMappedRawValue(row, sourceKey), displayType, { currencySymbol: resolvedCurrencySymbol })
  }, [getMappedRawValue, resolveCurrencySymbol])

  function getMappedNumericValue(row: ReportRow, sourceKey: string): number | null {
    const value = getMappedRawValue(row, sourceKey)
    if (typeof value !== 'number') return null
    // Formula results keep NaN so aggregates surface broken formulas.
    if (Number.isNaN(value)) return sourceColumnByKey.has(sourceKey) ? null : value
    return Number.isFinite(value) ? value : null
  }

  function getDistinctCount(rowsToAggregate: ReportRow[], sourceKey: string): number {
    const seen = new Set<string>()
    for (const row of rowsToAggregate) {
      const value = getMappedRawValue(row, sourceKey)
      if (value === null || value === undefined || value === '') continue
      if (typeof value === 'number' && Number.isNaN(value)) continue
      seen.add(`${typeof value}:${String(value)}`)
    }
    return seen.size
  }

  function getAggregatedFieldValue(rowsToAggregate: ReportRow[], sourceKey: string, mode: AggregationMode): number | null {
    if (mode === 'none') return null
    if (mode === 'count') return rowsToAggregate.length
    if (mode === 'distinct') return getDistinctCount(rowsToAggregate, sourceKey)
    let total = 0
    let count = 0
    for (const row of rowsToAggregate) {
      const numeric = getMappedNumericValue(row, sourceKey)
      if (numeric === null) continue
      if (Number.isNaN(numeric)) return Number.NaN
      total += numeric
      count += 1
    }
    if (count === 0) return null
    return mode === 'avg' ? total / count : total
  }

  // Each column totals by its own aggregation setting, wherever totals appear
  // (summary chips, group totals, grand total), so e.g. a rate can average
  // while hours sum.
  function formatFieldTotal(rowsToAggregate: ReportRow[], field: ReportField): string {
    const value = getAggregatedFieldValue(rowsToAggregate, field.sourceKey, field.aggregation)
    if (value === null) return ''
    if (Number.isNaN(value)) return 'Invalid formula'
    const displayType = getTotalDisplayType(field)
    return formatCellValue(value, displayType, { currencySymbol: resolveCurrencySymbol(displayType, field.currencySymbol) })
  }

  const verticalColumns = useMemo(() => {
    const firstField = reportFields[0]
    if (!firstField) return [] as Array<{ key: string, headerValue: string, rows: ReportRow[] }>
    return previewRows.map((row) => ({
      key: row.id,
      headerValue: getMappedValue(row, firstField.sourceKey, firstField.displayType),
      rows: [row],
    }))
  }, [getMappedValue, previewRows, reportFields])

  const summaryItems = buildSummaryItems({ fields: reportFields, rows, formatFieldTotal })

  return {
    sourceOptions,
    formulaTokenOptions,
    previewRows,
    isHorizontalTable,
    summaryItems,
    verticalColumns,
    getPreferredDisplayType,
    getMappedValue,
    getMappedRawValue,
    formatFieldTotal,
  }
}
