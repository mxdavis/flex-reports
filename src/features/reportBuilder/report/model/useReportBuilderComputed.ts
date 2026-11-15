import { getRowKey } from '../../../../services/adapters/recordsDataSource'
import { useCallback, useMemo } from 'react'
import { evaluateFormula } from '../../../../services/formula/evaluateFormula'
import { getDefaultDisplayType } from '../../../../services/reportDefinition/displayType'
import type { ReportRow, SeedFormula } from '../../../../services/adapters'
import type { AggregateMode } from '../../types'
import type { ChipAggregationMode, DisplayType, ReportField, SourceColumn } from '../../../../services/reportDefinition/types'
import { DEFAULT_CURRENCY_SYMBOL, getChipAggregationLabel, getDefaultChipAggregation } from '../../config'
import { formatCellValue, isValidReportDate, toReportNumber } from '../../../../utils/reportBuilder'
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
    if (formulasByLabel.has(normalizedKey)) return 'decimal'

    const schemaField = sourceColumnByKey.get(sourceKey)
    if (schemaField) return getDefaultDisplayType(schemaField)
    return getDefaultDisplayType({ key: sourceKey, dataType: 'string' })
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
      const raw = Object.hasOwn(row, mappedColumn.key) ? row[mappedColumn.key] : undefined
      const value = displayType === 'string' || displayType === 'date' ? raw : toReportNumber(raw)
      return formatCellValue(value, displayType, { currencySymbol: resolvedCurrencySymbol })
    }

    if (!formulasByLabel.has(sourceKey.toLowerCase())) return 'Missing field'
    const value = getFormulaValue(sourceKey, new Map(), new Set(), row)
    if (!Number.isFinite(value)) return 'Invalid formula'
    return formatCellValue(value, displayType, { currencySymbol: resolvedCurrencySymbol })
  }, [currencySymbol, formulasByLabel, getFormulaValue, sourceColumnByKey])

  function getMappedNumericValue(row: ReportRow, sourceKey: string): number | null {
    const mappedColumn = sourceColumnByKey.get(sourceKey)
    if (mappedColumn) {
      return toReportNumber(Object.hasOwn(row, mappedColumn.key) ? row[mappedColumn.key] : undefined)
    }

    if (!formulasByLabel.has(sourceKey.toLowerCase())) return Number.NaN
    return getFormulaValue(sourceKey, new Map(), new Set(), row)
  }

  function getMappedRawValue(row: ReportRow, sourceKey: string): unknown {
    const mappedColumn = sourceColumnByKey.get(sourceKey)
    if (mappedColumn) {
      return Object.hasOwn(row, mappedColumn.key) ? row[mappedColumn.key] : undefined
    }

    if (!formulasByLabel.has(sourceKey.toLowerCase())) return Number.NaN
    return getFormulaValue(sourceKey, new Map(), new Set(), row)
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
    if (!Number.isFinite(total)) return Number.NaN
    return mode === 'avg' ? total / count : total
  }

  const verticalColumns = useMemo(() => {
    const firstField = reportFields[0]
    if (!firstField) return [] as Array<{ key: string, headerValue: string, rows: ReportRow[] }>
    return previewRows.map((row) => ({
      key: getRowKey(row),
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

  const issues: string[] = []
  for (const field of reportFields) {
    if (rows.length === 0) continue
    if (!sourceColumnByKey.has(field.sourceKey) && !formulasByLabel.has(field.sourceKey.toLowerCase())) {
      issues.push(`Column ${field.label}: source field is missing. Choose an available field.`)
    } else if (field.displayType === 'date' && rows.some((row) => {
      const value = getMappedRawValue(row, field.sourceKey)
      return value != null && !isValidReportDate(value)
    })) {
      issues.push(`Column ${field.label}: use valid YYYY-MM-DD dates. Original values are shown.`)
    }
  }
  for (const formula of formulas) {
    if (rows.some((row) => !Number.isFinite(getFormulaValue(formula.label, new Map(), new Set(), row)))) {
      issues.push(`Formula ${formula.label}: check references, circular dependencies, and arithmetic.`)
    }
  }

  return {
    issues,
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
