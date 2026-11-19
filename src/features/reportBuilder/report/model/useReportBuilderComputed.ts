import { getColumnPath, readFieldPath } from '../../../../services/adapters/fieldPath'
import { getRowKey } from '../../../../services/adapters/recordsDataSource'
import { useCallback, useEffect, useMemo } from 'react'
import { getDefaultDisplayType } from '../../../../services/reportDefinition/displayType'
import type { ReportRow, ReportFormula } from '../../../../services/adapters'
import type { AggregationMode, DisplayType, ReportField, SourceColumn, TableOrientation } from '../../../../services/reportDefinition/types'
import { DEFAULT_CURRENCY_SYMBOL } from '../../config'
import { formatCellValue, isBlankReportValue, parseReportNumber, toReportNumber } from '../../../../utils/reportBuilder'
import { buildSummaryItems } from '../../summaryItems'
import { getTotalDisplayType, isNumericDisplayType } from './fieldTotals'
import { aggregateValues } from './aggregateValues'
import type { GetFieldValue } from './pivotLayout'
import { findFormulaNotes, findReportIssues } from './reportIssues'
import { getRowFormulaValue } from './rowFormulaValue'

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

  const formulaNotes = useMemo(
    () => findFormulaNotes(formulas, sourceColumns.map((column) => String(column.key))),
    [formulas, sourceColumns],
  )

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
      console.warn(`[flex-reports] Columns point at fields that aren't in the data or formulas: ${missingSourceSummary}.`)
    }
  }, [missingSourceSummary])

  // Editors only: viewers can't fix the column, so they just see it blank.
  const getFieldWarning = useCallback((field: ReportField): string | null => {
    if (!showTips || !missingSourceFields.includes(field)) return null
    return `Field "${field.sourceKey}" isn't in the data or formulas. Edit the column to pick another field.`
  }, [missingSourceFields, showTips])

  const isHorizontalTable = tableOrientation === 'horizontal'

  function getPreferredDisplayType(sourceKey: string): DisplayType {
    if (isFormulaSource(sourceKey.trim())) return 'decimal'
    const schemaField = getSourceColumn(sourceKey)
    return getDefaultDisplayType(schemaField)
  }

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
      const value = getRowFormulaValue(sourceKey.slice(1).trim(), row, {
        formulasByLabel,
        readDataNumber: (reference, dataRow) => {
          const column = getSourceColumn(reference)
          return column ? toReportNumber(readFieldPath(dataRow, column.path)) : Number.NaN
        },
      })
      rowCache.set(sourceKey, value)
      return value
    }
  }, [formulasByLabel, getSourceColumn, isFormulaSource])

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

  const getAggregatedFieldValue = useCallback((rowsToAggregate: ReportRow[], sourceKey: string, mode: AggregationMode) => (
    aggregateValues(rowsToAggregate.map((row) => getMappedRawValue(row, sourceKey)), mode, Boolean(getSourceColumn(sourceKey)))
  ), [getMappedRawValue, getSourceColumn])

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

  const issues = useMemo(() => findReportIssues({
    rows,
    fields: reportFields,
    formulas,
    getMappedRawValue,
    isDataField: (sourceKey) => Boolean(getSourceColumn(sourceKey)),
  }), [formulas, getMappedRawValue, getSourceColumn, reportFields, rows])

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
