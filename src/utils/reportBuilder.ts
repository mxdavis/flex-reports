import type { ReportFormula } from '../services/adapters'
import { DEFAULT_CURRENCY_SYMBOL } from '../services/reportDefinition/displayType'
import type { DisplayType } from '../services/reportDefinition/types'

type FormatCellOptions = {
  currencySymbol?: string
}

// Built once: constructing Intl formatters per cell dominated render time on
// large reports.
const DATE_FORMAT = new Intl.DateTimeFormat('en-US', { year: 'numeric', month: '2-digit', day: '2-digit' })
const TWO_DECIMALS_FORMAT = new Intl.NumberFormat('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
const WHOLE_NUMBER_FORMAT = new Intl.NumberFormat('en-US', { maximumFractionDigits: 0 })

const PLAIN_NUMBER = /^[+-]?(?:\d+(?:\.\d*)?|\.\d+)(?:[eE][+-]?\d+)?$/
const GROUPED_NUMBER = /^[+-]?\d{1,3}(?:,\d{3})+(?:\.\d*)?$/

export function isBlankReportValue(value: unknown): boolean {
  return value === null || value === undefined || (typeof value === 'string' && value.trim() === '')
}

// Reads numeric text such as "1250.50", "-3" or "1,250.50". Currency symbols and
// other text aren't read: "$40" and "120USD" aren't numbers. Returns undefined
// for blanks and anything else.
export function parseReportNumber(value: unknown): number | undefined {
  if (typeof value === 'number') return Number.isFinite(value) ? value : undefined
  if (typeof value !== 'string') return undefined
  const text = value.trim()
  if (GROUPED_NUMBER.test(text)) return Number(text.replaceAll(',', ''))
  if (!PLAIN_NUMBER.test(text)) return undefined
  const number = Number(text)
  return Number.isFinite(number) ? number : undefined
}

// Formulas treat blank and non-numeric values as 0.
export function toReportNumber(value: unknown): number {
  return parseReportNumber(value) ?? 0
}

const DATE_ONLY = /^(\d{4})-(\d{2})-(\d{2})$/

// A date-only value ("2026-07-01") is a calendar day, so it's read in the
// viewer's timezone. new Date("2026-07-01") would read it as UTC midnight and
// show the previous day west of UTC. Values with a time are real instants.
function parseDate(value: unknown): Date {
  if (value instanceof Date) return value
  const text = String(value).trim()
  const dateOnly = DATE_ONLY.exec(text)
  if (dateOnly) {
    const parsed = new Date(`${text}T00:00:00`)
    const valid = parsed.getFullYear() === Number(dateOnly[1])
      && parsed.getMonth() === Number(dateOnly[2]) - 1 && parsed.getDate() === Number(dateOnly[3])
    return valid ? parsed : new Date(Number.NaN)
  }
  return new Date(text)
}

function toText(value: unknown): string {
  return typeof value === 'object' ? JSON.stringify(value) : String(value)
}

export function isValidReportDate(value: unknown): boolean {
  return value !== null && value !== undefined && Number.isFinite(parseDate(value).getTime())
}

export function formatCellValue(
  value: unknown,
  displayType: DisplayType,
  options?: FormatCellOptions,
): string {
  if (isBlankReportValue(value)) return ''

  if (typeof value === 'number' && Number.isNaN(value)) {
    // Broken formulas evaluate to NaN; totals show the same label.
    return 'Invalid formula'
  }

  if (displayType === 'string') return toText(value)

  if (displayType === 'date') {
    const parsedDate = parseDate(value)
    if (Number.isNaN(parsedDate.getTime())) {
      return String(value)
    }

    return DATE_FORMAT.format(parsedDate)
  }

  const currencySymbol = options?.currencySymbol || DEFAULT_CURRENCY_SYMBOL
  const number = parseReportNumber(value)
  if (number === undefined) return toText(value)

  switch (displayType) {
    case 'currency':
      return `${number < 0 ? '-' : ''}${currencySymbol}${TWO_DECIMALS_FORMAT.format(Math.abs(number))}`
    case 'number':
      return WHOLE_NUMBER_FORMAT.format(number)
    case 'decimal':
      return TWO_DECIMALS_FORMAT.format(number)
    case 'percent':
      return `${TWO_DECIMALS_FORMAT.format(number * 100)}%`
    default:
      return String(value)
  }
}

// The next name in a numbered series: ['field-1', 'field-4'] with prefix
// 'field-' gives 'field-5'. Names outside the series are ignored.
export function getNextSequencedName(prefix: string, existingNames: string[]): string {
  let maxSequence = 0
  for (const name of existingNames) {
    if (!name.startsWith(prefix)) continue
    const sequence = Number(name.slice(prefix.length))
    if (Number.isInteger(sequence) && sequence > maxSequence) maxSequence = sequence
  }
  return `${prefix}${maxSequence + 1}`
}

export function sortFormulasByLabel(items: ReportFormula[]): ReportFormula[] {
  return [...items].sort((left, right) => {
    return left.label.localeCompare(right.label, undefined, { sensitivity: 'base' })
  })
}
