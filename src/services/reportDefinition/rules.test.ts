import { describe, expect, it } from 'vitest'
import { getFormulaError, MAX_FORMULA_EXPRESSION_LENGTH } from './rules'

const options = { existingLabels: ['Line total'], fieldKeys: ['units', 'Price'] }

describe('getFormulaError', () => {
  it('accepts a valid formula', () => {
    expect(getFormulaError({ label: 'Margin', expression: '{{price}} - {{cost}}' }, options)).toBe('')
  })

  it('requires a label and an expression', () => {
    expect(getFormulaError({ label: ' ', expression: '1' }, options)).toBe('Label and expression are required.')
    expect(getFormulaError({ label: 'A', expression: '' }, options)).toBe('Label and expression are required.')
  })

  it('rejects labels that would be impossible to reference', () => {
    expect(getFormulaError({ label: '9 lives', expression: '1' }, options)).toMatch(/must start with a letter/)
    expect(getFormulaError({ label: 'net-fees', expression: '1' }, options)).toMatch(/must start with a letter/)
  })

  it('rejects a label already used by a data field or another formula, ignoring case', () => {
    expect(getFormulaError({ label: 'price', expression: '1' }, options)).toBe('"price" is already a data field. Pick a different formula label.')
    expect(getFormulaError({ label: 'LINE TOTAL', expression: '1' }, options)).toBe('A formula with label "LINE TOTAL" already exists.')
  })

  it('caps the expression length', () => {
    const tooLong = '1+'.repeat(MAX_FORMULA_EXPRESSION_LENGTH)
    expect(getFormulaError({ label: 'Big', expression: tooLong }, options)).toBe(`Expression must be ${MAX_FORMULA_EXPRESSION_LENGTH} characters or fewer.`)
  })
})
