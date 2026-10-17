import type { AggregationMode, DisplayType, SourceColumn } from './types'

export const DEFAULT_CURRENCY_SYMBOL = '$'

// A source not in the schema (or none) is treated as text.
export function getDefaultDisplayType(source?: Pick<SourceColumn, 'dataType'>): DisplayType {
  if (source?.dataType === 'currency') return 'currency'
  if (source?.dataType === 'number') return 'decimal'
  if (source?.dataType === 'date') return 'date'
  return 'string'
}

export function getDefaultAggregation(displayType: DisplayType): AggregationMode {
  return displayType === 'string' || displayType === 'date' ? 'distinct' : 'sum'
}
