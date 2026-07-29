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

  it('substitutes 0 for missing tokens', () => {
    expect(evaluateFormula('{{missing}} + 20', {})).toEqual({ ok: true, value: 20 })
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
})
