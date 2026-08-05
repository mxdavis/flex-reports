import type { SeedFormula } from '../services/adapters'
import type { DisplayType } from '../services/reportDefinition/types'

export function formatCellValue(value: unknown, displayType: DisplayType): string {
  if (value === null || value === undefined) {
    return ''
  }

  if (typeof value === 'number' && Number.isNaN(value)) {
    return 'NaN'
  }

  if (displayType === 'string') {
    return String(value)
  }

  if (displayType === 'date') {
    const parsedDate = value instanceof Date ? value : new Date(String(value))
    if (Number.isNaN(parsedDate.getTime())) {
      return String(value)
    }

    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).format(parsedDate)
  }

  if (typeof value !== 'number') {
    return String(value)
  }

  switch (displayType) {
    case 'currency':
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
      }).format(value)
    case 'decimal':
      return value.toFixed(2)
    case 'percent':
      return `${(value * 100).toFixed(2)}%`
    default:
      return String(value)
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
