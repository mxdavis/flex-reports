import { isBlankReportValue, isValidReportDate, parseReportNumber } from '../../utils/reportBuilder'
import type { SchemaDataType } from './types'

// ISO dates ("2026-07-01") and date-times ("2026-07-01T09:30:00Z"). Other
// date text ("07/01/2026", "July 1") is ambiguous across countries, so it stays text.
const ISO_DATE = /^\d{4}-\d{2}-\d{2}(?:T\d{2}:\d{2}(?::\d{2}(?:\.\d+)?)?(?:Z|[+-]\d{2}:?\d{2})?)?$/
// A leading zero ("02134", "007") marks a code, such as a ZIP or account number.
const LEADING_ZERO = /^[+-]?0\d/

function isNumberValue(value: unknown): boolean {
  if (typeof value === 'string' && LEADING_ZERO.test(value.trim())) return false
  return parseReportNumber(value) !== undefined
}

function isDateValue(value: unknown): boolean {
  if (value instanceof Date) return Number.isFinite(value.getTime())
  return typeof value === 'string' && ISO_DATE.test(value.trim()) && isValidReportDate(value)
}

// A field's starting type, from its values: Number when every non-blank value
// is a number (or numeric text), Date when every one is an ISO date, else
// text. Editors can change it; this only picks a sensible start.
export function guessDataType(values: Iterable<unknown>): SchemaDataType {
  let couldBeNumber = true
  let couldBeDate = true
  let hasValue = false
  for (const value of values) {
    if (isBlankReportValue(value)) continue
    hasValue = true
    couldBeNumber &&= isNumberValue(value)
    couldBeDate &&= isDateValue(value)
    if (!couldBeNumber && !couldBeDate) return 'string'
  }
  if (!hasValue) return 'string'
  return couldBeNumber ? 'number' : couldBeDate ? 'date' : 'string'
}
