import { describe, expect, it } from 'vitest'
import { evaluateFormula } from './evaluateFormula'

describe('evaluateFormula', () => {
  it('handles token replacement and arithmetic', () => {
    const result = evaluateFormula('{{hours}} * {{rate}}', {
      hours: 2.5,
      rate: 240,
    })

    expect(result).toBe(600)
  })

  it('handles percent literals', () => {
    const result = evaluateFormula('{{grossFees}} * 10%', {
      grossFees: 500,
    })

    expect(result).toBe(50)
  })

  it('returns 0 for missing tokens', () => {
    const result = evaluateFormula('{{missing}} + 20', {})

    expect(result).toBe(20)
  })

  it('returns 0 for an empty or undefined expression', () => {
    expect(evaluateFormula('', {})).toBe(0)
    expect(evaluateFormula(undefined, {})).toBe(0)
  })

  it('returns 0 for malformed-but-allowed expressions', () => {
    expect(evaluateFormula('1..2', {})).toBe(0)
  })

  it('respects operator precedence and parentheses', () => {
    expect(evaluateFormula('2 + 3 * 4', {})).toBe(14)
    expect(evaluateFormula('(2 + 3) * 4', {})).toBe(20)
    expect(evaluateFormula('-{{rate}} + 10', { rate: 4 })).toBe(6)
  })

  it('returns 0 for unbalanced parentheses', () => {
    expect(evaluateFormula('(2 + 3', {})).toBe(0)
  })
})
