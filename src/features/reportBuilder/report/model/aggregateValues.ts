import type { AggregationMode } from '../../../../services/reportDefinition/types'
import { parseReportNumber } from '../../../../utils/reportBuilder'
import { isBlank } from './pivotLayout'

// A column's total over its raw values: a count, a distinct count, or a sum or
// average. Data values that are blank or aren't numbers are left out, so they
// don't lower averages; formula values are already numbers. NaN means a broken
// formula, and null means there's nothing to total.
export function aggregateValues(values: unknown[], mode: AggregationMode, isDataField: boolean): number | null {
  if (mode === 'none') return null
  if (mode === 'count') return values.length
  if (mode === 'distinct') {
    const seen = new Set<string>()
    for (const value of values) {
      if (isBlank(value)) continue
      seen.add(`${typeof value}:${String(value)}`)
    }
    return seen.size
  }

  let total = 0
  let count = 0
  for (const raw of values) {
    const value = isDataField ? parseReportNumber(raw) : raw
    if (typeof value !== 'number') continue
    if (!Number.isFinite(value)) return Number.NaN
    total += value
    count += 1
  }
  if (count === 0) return null
  if (!Number.isFinite(total)) return Number.NaN
  return mode === 'avg' ? total / count : total
}
