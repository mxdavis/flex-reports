import type { SeedFormula } from '../adapters'

export const FORMULA_DATA_STORAGE_KEY = 'flex-reports.formulas.v1'

type LegacySeedFormula = {
  columnId?: unknown
  label?: unknown
  expression?: unknown
}

function toSeedFormula(value: unknown): SeedFormula | null {
  if (!value || typeof value !== 'object') {
    return null
  }

  const candidate = value as LegacySeedFormula
  if (typeof candidate.expression !== 'string') {
    return null
  }

  if (typeof candidate.label === 'string') {
    return {
      label: candidate.label,
      expression: candidate.expression,
    }
  }

  // Backward compatibility for previously stored { columnId, label, expression }.
  if (typeof candidate.columnId === 'string') {
    return {
      label: candidate.columnId,
      expression: candidate.expression,
    }
  }

  return null
}

export function loadFormulaData(fallback: SeedFormula[]): SeedFormula[] {
  if (typeof window === 'undefined') {
    return fallback
  }

  try {
    const raw = window.localStorage.getItem(FORMULA_DATA_STORAGE_KEY)
    if (!raw) {
      return fallback
    }

    const parsed = JSON.parse(raw) as unknown
    if (!Array.isArray(parsed)) {
      return fallback
    }

    const formulas = parsed
      .map(toSeedFormula)
      .filter((formula): formula is SeedFormula => Boolean(formula))
      .map((formula) => ({
        label: formula.label.trim(),
        expression: formula.expression.trim(),
      }))
      .filter((formula) => formula.label.length > 0 && formula.expression.length > 0)

    const seenLabels = new Set<string>()
    const uniqueFormulas = formulas.filter((formula) => {
      const normalizedLabel = formula.label.toLowerCase()
      if (seenLabels.has(normalizedLabel)) {
        return false
      }

      seenLabels.add(normalizedLabel)
      return true
    })

    return uniqueFormulas.length > 0 ? uniqueFormulas : fallback
  } catch {
    return fallback
  }
}

export function saveFormulaData(formulas: SeedFormula[]): void {
  if (typeof window === 'undefined') {
    return
  }

  try {
    window.localStorage.setItem(FORMULA_DATA_STORAGE_KEY, JSON.stringify(formulas))
  } catch {
    // Write failures can happen in private mode or when storage is full.
  }
}