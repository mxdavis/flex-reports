import type { ChipAggregationMode, DisplayType } from '../../services/reportDefinition/types'

export const MAX_REPORT_COLUMNS = 15
export const MIN_REPORT_COLUMNS = 1
export const MAX_FORMULAS = 25
export const DEFAULT_SHEET_NAME = 'Sample rows'
export const SHEET_NAME_STORAGE_KEY = 'flex-reports.sheet-name.v1'
export const CURRENCY_SYMBOL_STORAGE_KEY = 'flex-reports.currency-symbol.v1'
export const DEFAULT_CURRENCY_SYMBOL = '$'

export const DISPLAY_TYPE_OPTIONS: Array<{ value: DisplayType, label: string }> = [
  { value: 'currency', label: 'Currency' },
  { value: 'number', label: 'Number' },
  { value: 'decimal', label: 'Decimal number' },
  { value: 'percent', label: 'Percent' },
  { value: 'date', label: 'Date' },
  { value: 'string', label: 'String' },
]

export const CHIP_AGGREGATION_OPTIONS: Array<{ value: ChipAggregationMode, label: string }> = [
  { value: 'none', label: 'None' },
  { value: 'sum', label: 'Sum' },
  { value: 'avg', label: 'Average' },
  { value: 'count', label: 'Count (unique values)' },
]

export const EDIT_MODE_JUMP_TARGETS = [
  { id: 'report-columns', label: 'Columns' },
  { id: 'report-formulas', label: 'Formulas' },
  { id: 'report-chart', label: 'Chart' },
]

export function getDefaultChipAggregation(displayType: DisplayType): ChipAggregationMode {
  return displayType === 'string' || displayType === 'date' ? 'count' : 'sum'
}

export function getChipAggregationLabel(
  chipAggregation: ChipAggregationMode,
  _displayType: DisplayType,
): string {
  return chipAggregation
}
