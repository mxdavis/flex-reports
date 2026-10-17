import type { AggregationMode, DisplayType } from '../../services/reportDefinition/types'

export { DEFAULT_CURRENCY_SYMBOL, getDefaultAggregation } from '../../services/reportDefinition/displayType'
export { DEFAULT_SHEET_NAME } from '../../services/reportDefinition/normalize'

export const MAX_REPORT_COLUMNS = 15
export const MIN_REPORT_COLUMNS = 1
export const MAX_FORMULAS = 25
export const DEFAULT_MAX_VISIBLE_ROWS = 1000
// Vertical view turns each row into a column, so past this it stops being readable.
export const MAX_VERTICAL_VIEW_ROWS = 100

export const DISPLAY_TYPE_OPTIONS: Array<{ value: DisplayType, label: string }> = [
  { value: 'currency', label: 'Currency' },
  { value: 'number', label: 'Number' },
  { value: 'decimal', label: 'Decimal number' },
  { value: 'percent', label: 'Percent' },
  { value: 'date', label: 'Date' },
  { value: 'string', label: 'String' },
]

export const AGGREGATION_OPTIONS: Array<{ value: AggregationMode, label: string }> = [
  { value: 'none', label: 'None' },
  { value: 'sum', label: 'Sum' },
  { value: 'avg', label: 'Average' },
  { value: 'count', label: 'Count' },
  { value: 'distinct', label: 'Distinct count' },
]

// Sections the edit toolbar can jump to, by their element ID name (see useElementId).
export const EDIT_MODE_JUMP_TARGETS = [
  { section: 'report-columns', label: 'Columns' },
  { section: 'report-formulas', label: 'Formulas' },
  { section: 'report-table', label: 'Table' },
]

export function getAggregationLabel(aggregation: AggregationMode): string {
  if (aggregation === 'distinct') return 'distinct count'
  return aggregation
}
