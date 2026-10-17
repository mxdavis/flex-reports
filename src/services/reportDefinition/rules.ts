import type { ReportFormula } from '../adapters'

// The rules a report definition must follow. The editor enforces them as users
// type, and normalizeReportDefinition repairs saved definitions that break them
// (a host may build definitions on its server).
export const MIN_REPORT_COLUMNS = 1
export const MAX_REPORT_COLUMNS = 15
export const MAX_FORMULAS = 25
// Keeps every expression cheap to evaluate for every row.
export const MAX_FORMULA_EXPRESSION_LENGTH = 500

const FORMULA_LABEL_PATTERN = /^[A-Za-z][A-Za-z0-9_ ]*$/

type FormulaCheckOptions = {
  // Labels already taken by other formulas.
  existingLabels: string[]
  // The data's field keys: a formula can't share a name with one.
  fieldKeys: string[]
}

// The problem with a formula, or '' when it's valid.
export function getFormulaError(formula: ReportFormula, { existingLabels, fieldKeys }: FormulaCheckOptions): string {
  const label = formula.label.trim()
  const expression = formula.expression.trim()
  if (!label || !expression) return 'Label and expression are required.'
  if (!FORMULA_LABEL_PATTERN.test(label)) {
    return 'Label must start with a letter and use only letters, numbers, spaces, and _.'
  }
  const normalizedLabel = label.toLowerCase()
  if (fieldKeys.some((key) => key.toLowerCase() === normalizedLabel)) {
    return `"${label}" is already a data field. Pick a different formula label.`
  }
  if (existingLabels.some((existing) => existing.toLowerCase() === normalizedLabel)) {
    return `A formula with label "${label}" already exists.`
  }
  if (expression.length > MAX_FORMULA_EXPRESSION_LENGTH) {
    return `Expression must be ${MAX_FORMULA_EXPRESSION_LENGTH} characters or fewer.`
  }
  return ''
}
