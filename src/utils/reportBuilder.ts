import type { SeedFormula } from '../services/adapters'
import type { DisplayType } from '../services/reportDefinition/types'

type FormatCellOptions = {
  currencySymbol?: string
}

export function toReportNumber(value: unknown): number {
  if (typeof value === 'number') return Number.isFinite(value) ? value : 0
  if (typeof value !== 'string') return 0
  const text = value.trim()
  if (!/^[+-]?(?:\d+(?:\.\d*)?|\.\d+)(?:[eE][+-]?\d+)?$/.test(text)) return 0
  const number = Number(text)
  return Number.isFinite(number) ? number : 0
}

export function isValidReportDate(value: unknown): boolean {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false
  const parsed = new Date(`${value}T00:00:00Z`)
  return Number.isFinite(parsed.getTime()) && parsed.toISOString().slice(0, 10) === value
}

export function formatCellValue(
  value: unknown,
  displayType: DisplayType,
  options?: FormatCellOptions,
): string {
  if (displayType === 'string') {
    if (value === null || value === undefined) return ''
    return typeof value === 'object' ? JSON.stringify(value) : String(value)
  }
  if (displayType === 'date') {
    if (value === null || value === undefined) return ''
    if (!isValidReportDate(value)) return String(value)
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric', month: '2-digit', day: '2-digit', timeZone: 'UTC',
    }).format(new Date(`${value}T00:00:00Z`))
  }
  if (typeof value === 'number' && !Number.isFinite(value)) return 'Invalid calculation'
  const number = toReportNumber(value)
  const fixed = new Intl.NumberFormat('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
  switch (displayType) {
    case 'currency':
      return `${number < 0 ? '-' : ''}${options?.currencySymbol || '$'}${fixed.format(Math.abs(number))}`
    case 'number':
      return new Intl.NumberFormat('en-US', { maximumFractionDigits: 0 }).format(number)
    case 'percent':
      return `${fixed.format(number * 100)}%`
    default:
      return fixed.format(number)
  }
}

export function getNextFieldId(existingIds: string[]): string {
  let maxSequence = 0

  for (const id of existingIds) {
    const match = /^field-(\d+)$/.exec(id)
    if (!match) {
      continue
    }

    const sequence = Number(match[1])
    if (Number.isFinite(sequence) && sequence > maxSequence) {
      maxSequence = sequence
    }
  }

  return `field-${maxSequence + 1}`
}

export function getNextFormulaLabel(existingLabels: string[]): string {
  let maxSequence = 0

  for (const label of existingLabels) {
    const match = /^formula(\d+)$/.exec(label)
    if (!match) {
      continue
    }

    const sequence = Number(match[1])
    if (Number.isFinite(sequence) && sequence > maxSequence) {
      maxSequence = sequence
    }
  }

  return `formula${maxSequence + 1}`
}

export function validateFormulaInput(
  formulas: SeedFormula[],
  candidate: SeedFormula,
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

export function sortFormulasByLabel(items: SeedFormula[]): SeedFormula[] {
  return [...items].sort((left, right) => {
    return left.label.localeCompare(right.label, undefined, { sensitivity: 'base' })
  })
}
