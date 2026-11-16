import { describe, expect, it } from 'vitest'
import { getFormulaReferences } from './formulaReferences'
import { evaluateFormula } from './evaluateFormula'
import { parseFieldPath, readFieldPath } from '../adapters/fieldPath'

describe('quoted formula references', () => {
  it('parses closing delimiters, quotes and backslashes inside literal keys before closing the token', () => {
    const keys = ['part}}end', '{{start', 'quote"key', 'back\\slash', '', 'client.name', '%formula']
    const row = Object.fromEntries(keys.map((key) => [key, 2]))
    const expression = keys.map((key) => `{{${JSON.stringify([key])}}}`).join(' + ')
    expect(getFormulaReferences(expression).map((token) => token.reference)).toEqual(keys.map((key) => JSON.stringify([key])))
    expect(evaluateFormula(expression, (reference) => Number(readFieldPath(row, parseFieldPath(reference)!))))
      .toEqual({ ok: true, value: 14 })
  })

  it('rejects incomplete quoted paths rather than using an inner closing delimiter', () => {
    const expression = '{{["a}}'
    expect(getFormulaReferences(expression)[0].end).toBeNull()
    expect(evaluateFormula(expression, () => 3).ok).toBe(false)
  })
})
