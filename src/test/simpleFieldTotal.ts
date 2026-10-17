import type { ReportRow } from '../services/adapters'
import type { ReportField } from '../services/reportDefinition/types'

// Minimal stand-in for the builder's formatFieldTotal: aggregates raw row
// values by the field's own aggregation and prints them plainly.
export function simpleFieldTotal(rows: ReportRow[], field: ReportField): string {
  const values = rows.map((row) => row[field.sourceKey])
  if (field.aggregation === 'none') return ''
  if (field.aggregation === 'count') return String(values.length)
  if (field.aggregation === 'distinct') return String(new Set(values.map(String)).size)
  const numbers = values.filter((value): value is number => typeof value === 'number')
  if (numbers.length === 0) return ''
  const sum = numbers.reduce((total, value) => total + value, 0)
  return String(field.aggregation === 'avg' ? sum / numbers.length : sum)
}

export function plainMappedValue(row: ReportRow, sourceKey: string): string {
  return String(row[sourceKey] ?? '')
}

export function rawValue(row: ReportRow, sourceKey: string): unknown {
  return row[sourceKey]
}
