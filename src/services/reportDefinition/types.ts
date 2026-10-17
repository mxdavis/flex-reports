import type { ReportFormula, SchemaDataType } from '../adapters'

export type SourceColumn = {
  id: string
  key: string
  label: string
  dataType: SchemaDataType
}

export type DisplayType = 'currency' | 'number' | 'decimal' | 'percent' | 'date' | 'string'

// How a column is totalled: in summary chips, group totals, and the grand total.
export type AggregationMode = 'none' | 'sum' | 'avg' | 'count' | 'distinct'

export type TableOrientation = 'horizontal' | 'vertical'

export type ReportField = {
  id: string
  label: string
  sourceKey: string
  displayType: DisplayType
  aggregation: AggregationMode
}

// The default view every viewer lands on.
export type ReportView = {
  orientation: TableOrientation
  showTotals: boolean
  isGroupingEnabled: boolean
  // How many grouping levels start expanded: 0 shows only the first column's
  // group totals, 1 opens those one level, and so on. null = fully expanded.
  expandedLevels: number | null
}

export const REPORT_DEFINITION_VERSION = 1

// The only artifact Flex Reports persists. The host stores it however it likes
// and passes it back in as `reportDefinition`.
export type ReportDefinition = {
  version: typeof REPORT_DEFINITION_VERSION
  sheetName: string
  currencySymbol: string
  fields: ReportField[]
  formulas: ReportFormula[]
  view: ReportView
}
