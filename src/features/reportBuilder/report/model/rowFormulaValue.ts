import type { ReportRow } from '../../../../services/adapters'
import { evaluateFormula } from '../../../../services/formula/evaluateFormula'

type FormulaContext = {
  // Each formula's expression by lowercased label.
  formulasByLabel: Map<string, string>
  // A data field's value in a row as a number, or NaN when it isn't a field.
  readDataNumber: (reference: string, row: ReportRow) => number
}

// A formula's value for one row. Formulas can use other formulas ("%Name"),
// each worked out once per row; one that ends up using itself is NaN, like a
// circular reference in a spreadsheet.
export function getRowFormulaValue(formulaLabel: string, row: ReportRow, context: FormulaContext): number {
  const cache = new Map<string, number>()
  const visiting = new Set<string>()

  function evaluate(labelToEvaluate: string): number {
    const label = labelToEvaluate.toLowerCase()
    const cached = cache.get(label)
    if (cached !== undefined) return cached
    if (visiting.has(label)) return Number.NaN
    const expression = context.formulasByLabel.get(label)
    if (expression === undefined) return Number.NaN
    visiting.add(label)
    const result = evaluateFormula(expression, (reference) => (
      reference.startsWith('%') ? evaluate(reference.slice(1)) : context.readDataNumber(reference, row)
    ))
    const value = result.ok ? result.value : Number.NaN
    cache.set(label, value)
    visiting.delete(label)
    return value
  }

  return evaluate(formulaLabel)
}
