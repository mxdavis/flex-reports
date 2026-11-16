import { describe, expect, it } from 'vitest'
import { evaluateFormula } from './evaluateFormula'

describe('evaluateFormula', () => {
  it('handles token replacement and arithmetic', () => {
    expect(evaluateFormula('{{hours}} * {{rate}}', { hours: 2.5, rate: 240 })).toEqual({
      ok: true,
      value: 600,
    })
  })

  it('handles percent literals', () => {
    expect(evaluateFormula('{{grossFees}} * 10%', { grossFees: 500 })).toEqual({
      ok: true,
      value: 50,
    })
  })

  it('handles exact token references and formula labels with spaces', () => {
    expect(evaluateFormula('{{%Write Down}} + {{Hours}}', {
      '%Write Down': 15,
      Hours: 5,
    })).toEqual({
      ok: true,
      value: 20,
    })
  })

  it('rejects missing tokens instead of silently replacing them with zero', () => {
    expect(evaluateFormula('{{missing}} + 20', {})).toMatchObject({ ok: false, code: 'invalid-reference' })
  })

  it('respects operator precedence and parentheses', () => {
    expect(evaluateFormula('2 + 3 * 4', {})).toEqual({ ok: true, value: 14 })
    expect(evaluateFormula('(2 + 3) * 4', {})).toEqual({ ok: true, value: 20 })
    expect(evaluateFormula('-{{rate}} + 10', { rate: 4 })).toEqual({ ok: true, value: 6 })
  })

  it('reports an error for an empty or undefined expression', () => {
    expect(evaluateFormula('', {})).toMatchObject({ ok: false, code: 'empty-expression' })
    expect(evaluateFormula(undefined, {})).toMatchObject({
      ok: false,
      code: 'empty-expression',
    })
  })

  it('reports unsupported syntax instead of throwing', () => {
    expect(evaluateFormula('Math.max(1, 2)', {})).toMatchObject({
      ok: false,
      code: 'unsupported-syntax',
    })
  })

  it('reports malformed expressions instead of returning a silent 0', () => {
    expect(evaluateFormula('1..2', {})).toMatchObject({
      ok: false,
      code: 'malformed-expression',
    })
    expect(evaluateFormula('(2 + 3', {})).toMatchObject({
      ok: false,
      code: 'malformed-expression',
    })
  })

  it('reports division by zero and non-finite results as errors', () => {
    expect(evaluateFormula('10 / 0', {})).toMatchObject({ ok: false })
    expect(evaluateFormula('1e308 * 2', {})).toMatchObject({ ok: false })
  })

  it('handles signed values and exponent notation without changing precedence', () => {
    expect(evaluateFormula('10 - {{value}}', { value: -3 })).toEqual({ ok: true, value: 13 })
    expect(evaluateFormula('{{value}} * 2', { value: 1e-7 })).toEqual({ ok: true, value: 2e-7 })
    expect(evaluateFormula('1e2 + .5', {})).toEqual({ ok: true, value: 100.5 })
  })
})
