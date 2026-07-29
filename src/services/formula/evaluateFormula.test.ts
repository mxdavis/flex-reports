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
})
