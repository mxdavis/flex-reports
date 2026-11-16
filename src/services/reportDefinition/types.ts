import type { ReportFormula, SchemaField } from '../adapters'

// A field the host's rows have (the schema), as the report sees it.
export type SourceColumn = SchemaField

export const DISPLAY_TYPES = ['currency', 'number', 'decimal', 'percent', 'date', 'string'] as const
export type DisplayType = typeof DISPLAY_TYPES[number]

// How a column is totalled: in summary chips, group totals, and the grand total.
export const AGGREGATION_MODES = ['none', 'sum', 'avg', 'count', 'distinct'] as const
export type AggregationMode = typeof AGGREGATION_MODES[number]

export type TableOrientation = 'horizontal' | 'vertical'

export type ReportField = {
  id: string
  label: string
  sourceKey: string
  sourcePath?: readonly string[]
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

// How numbers are written in the data. 'commas' reads "1,250.50" as 1250.5;
// 'plain' reads only "1250.50", and anything with a comma isn't a number.
export const NUMBER_FORMATS = ['commas', 'plain'] as const
export type NumberFormat = typeof NUMBER_FORMATS[number]
export const DEFAULT_NUMBER_FORMAT: NumberFormat = 'commas'

export const REPORT_DEFINITION_VERSION = 1

// The only artifact Flex Reports persists. The host stores it however it likes
// and passes it back in as `reportDefinition`.
export type ReportDefinition = {
  version: typeof REPORT_DEFINITION_VERSION
  sheetName: string
  currencySymbol: string
  numberFormat: NumberFormat
  fields: ReportField[]
  formulas: ReportFormula[]
  view: ReportView
}
