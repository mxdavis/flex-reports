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

const DATE_ONLY = /^(\d{4})-(\d{2})-(\d{2})$/

// A date-only value ("2026-07-01") is a calendar day, so it's read in the
// viewer's timezone. new Date("2026-07-01") would read it as UTC midnight and
// show the previous day west of UTC. Values with a time are real instants.
function parseDate(value: unknown): Date {
  if (value instanceof Date) return value
  const text = String(value).trim()
  const dateOnly = DATE_ONLY.exec(text)
  if (dateOnly) return new Date(Number(dateOnly[1]), Number(dateOnly[2]) - 1, Number(dateOnly[3]))
  return new Date(text)
}

export function formatCellValue(
  value: unknown,
  displayType: DisplayType,
  options?: FormatCellOptions,
): string {
  if (value === null || value === undefined) {
    return ''
  }

  if (typeof value === 'number' && Number.isNaN(value)) {
    // Broken formulas evaluate to NaN; totals show the same label.
    return 'Invalid formula'
  }

  if (displayType === 'string') {
    return String(value)
  }

  if (displayType === 'date') {
    const parsedDate = parseDate(value)
    if (Number.isNaN(parsedDate.getTime())) {
      return String(value)
    }

    return DATE_FORMAT.format(parsedDate)
  }

  if (typeof value !== 'number') {
    return String(value)
  }

  switch (displayType) {
    case 'currency':
      return `${value < 0 ? '-' : ''}${options?.currencySymbol || DEFAULT_CURRENCY_SYMBOL}${TWO_DECIMALS_FORMAT.format(Math.abs(value))}`
    case 'number':
      return WHOLE_NUMBER_FORMAT.format(value)
    case 'decimal':
      return TWO_DECIMALS_FORMAT.format(value)
    case 'percent':
      return `${TWO_DECIMALS_FORMAT.format(value * 100)}%`
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

export function validateFormulaInput(
  formulas: ReportFormula[],
  candidate: ReportFormula,
  options?: { ignoreLabel?: string },
): string {
  const label = candidate.label.trim()
  const expression = candidate.expression.trim()

  if (!label || !expression) {
    return 'Label and expression are required.'
  }

  if (!/^[A-Za-z][A-Za-z0-9_ ]*$/.test(label)) {
    return 'Label must start with a letter and use only letters, numbers, spaces, and _.'
  }

  const normalizedLabel = label.toLowerCase()
  const ignoredLabel = options?.ignoreLabel?.toLowerCase()
  const hasDuplicate = formulas.some((formula) => {
    const currentLabel = formula.label.toLowerCase()
    if (ignoredLabel && currentLabel === ignoredLabel) {
      return false
    }

    return currentLabel === normalizedLabel
  })

  if (hasDuplicate) {
    return `A formula with label "${label}" already exists.`
  }

  return ''
}

export function sortFormulasByLabel(items: ReportFormula[]): ReportFormula[] {
  return [...items].sort((left, right) => {
    return left.label.localeCompare(right.label, undefined, { sensitivity: 'base' })
  })
}
