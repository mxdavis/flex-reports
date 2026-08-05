import { useCallback, useMemo } from 'react'
import { evaluateFormula } from '../../../../services/formula/evaluateFormula'
import { getDefaultDisplayType } from '../../../../services/reportDefinition/displayType'
import type { ReportRow, SeedFormula } from '../../../../services/adapters'
import type { AggregateMode } from '../../types'
import type { ChipAggregationMode, DisplayType, ReportField, SourceColumn } from '../../../../services/reportDefinition/types'
import { DEFAULT_CURRENCY_SYMBOL, getChipAggregationLabel, getDefaultChipAggregation } from '../../config'
import { formatCellValue } from '../../../../utils/reportBuilder'
import { buildSummaryItems } from '../../summaryItems'

type UseReportBuilderComputedArgs = {
  rows: ReportRow[]
  sourceColumns: SourceColumn[]
  reportFields: ReportField[]
  formulas: SeedFormula[]
  currencySymbol: string
  tableOrientation: 'horizontal' | 'vertical'
  aggregateMode: AggregateMode
}

export function useReportBuilderComputed({
  rows,
  sourceColumns,
  reportFields,
  formulas,
  currencySymbol,
  tableOrientation,
  aggregateMode,
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
  const showTotals = aggregateMode !== 'none'

  function resolveChipAggregation(field: ReportField): ChipAggregationMode {
    return field.chipAggregation ?? getDefaultChipAggregation(field.displayType)
  }

  function getPreferredDisplayType(sourceKey: string): DisplayType {
    const normalizedKey = sourceKey.toLowerCase().trim()
    const numericBaseKeys = new Set(['grossfees', 'writedown', 'netfees'])
    if (formulasByLabel.has(normalizedKey)) return 'decimal'

    const schemaField = sourceColumnByKey.get(sourceKey)
    if (schemaField) return getDefaultDisplayType(schemaField)
    if (numericBaseKeys.has(normalizedKey)) return 'decimal'
    return getDefaultDisplayType({ key: sourceKey, dataType: 'string' })
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

  const getMappedValue = useCallback((
    row: ReportRow,
    sourceKey: string,
    displayType: DisplayType,
    localCurrencySymbol?: string,
  ): string => {
    const resolvedCurrencySymbol = displayType === 'currency'
      ? (currencySymbol.trim() || localCurrencySymbol?.trim() || DEFAULT_CURRENCY_SYMBOL)
      : undefined

    const mappedColumn = sourceColumnByKey.get(sourceKey)
    if (mappedColumn) {
      return formatCellValue((row as Record<string, unknown>)[String((mappedColumn as { key: string }).key)], displayType, {
        currencySymbol: resolvedCurrencySymbol,
      })
    }

    if (!formulasByLabel.has(sourceKey.toLowerCase())) return ''
    const context = buildBaseFormulaContext(row)
    const value = getFormulaValue(sourceKey, new Map(), new Set(), context)
    return formatCellValue(value, displayType, { currencySymbol: resolvedCurrencySymbol })
  }, [currencySymbol, formulasByLabel, getFormulaValue, sourceColumnByKey])

  function getMappedNumericValue(row: ReportRow, sourceKey: string): number | null {
    const mappedColumn = sourceColumnByKey.get(sourceKey)
    if (mappedColumn) {
      const value = (row as Record<string, unknown>)[String((mappedColumn as { key: string }).key)]
      return typeof value === 'number' && Number.isFinite(value) ? value : null
    }

    if (!formulasByLabel.has(sourceKey.toLowerCase())) return null
    const context = buildBaseFormulaContext(row)
    return getFormulaValue(sourceKey, new Map(), new Set(), context)
  }

  function getMappedRawValue(row: ReportRow, sourceKey: string): unknown {
    const mappedColumn = sourceColumnByKey.get(sourceKey)
    if (mappedColumn) {
      return (row as Record<string, unknown>)[String((mappedColumn as { key: string }).key)]
    }

    if (!formulasByLabel.has(sourceKey.toLowerCase())) return null
    const context = buildBaseFormulaContext(row)
    return getFormulaValue(sourceKey, new Map(), new Set(), context)
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

  function getAggregatedFieldValue(rowsToAggregate: ReportRow[], sourceKey: string, mode: AggregateMode): number | null {
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

  const verticalColumns = useMemo(() => {
    const firstField = reportFields[0]
    if (!firstField) return [] as Array<{ key: string, headerValue: string, rows: ReportRow[] }>
    return previewRows.map((row) => ({
      key: row.id,
      headerValue: getMappedValue(row, firstField.sourceKey, firstField.displayType),
      rows: [row],
    }))
  }, [getMappedValue, previewRows, reportFields])

  const summaryItems = buildSummaryItems({
    fields: reportFields,
    rows,
    currencySymbol,
    resolveChipAggregation,
    getChipAggregationLabel,
    getMappedValue,
    getMappedNumericValue,
  })

  return {
    sourceOptions,
    formulaTokenOptions,
    previewRows,
    isHorizontalTable,
    showTotals,
    summaryItems,
    verticalColumns,
    getPreferredDisplayType,
    getMappedValue,
    getAggregatedFieldValue,
  }
}
