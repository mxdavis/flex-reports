import type { DisplayType, ReportField } from '../../../../services/reportDefinition/types'

const NUMERIC_DISPLAY_TYPES: DisplayType[] = ['number', 'decimal', 'currency', 'percent']

export function isNumericDisplayType(displayType: DisplayType): boolean {
  return NUMERIC_DISPLAY_TYPES.includes(displayType)
}

// Counts are plain numbers; sums and averages keep the column's format, except
// text and dates, which have no numeric format of their own.
export function getTotalDisplayType(field: Pick<ReportField, 'aggregation' | 'displayType'>): DisplayType {
  if (field.aggregation === 'count' || field.aggregation === 'distinct') return 'number'
  if (field.displayType === 'string' || field.displayType === 'date') return 'decimal'
  return field.displayType
}

export function isNumericTotal(field: Pick<ReportField, 'aggregation' | 'displayType'>): boolean {
  return field.aggregation !== 'none' && isNumericDisplayType(getTotalDisplayType(field))
}
