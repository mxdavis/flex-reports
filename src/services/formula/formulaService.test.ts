import { describe, expect, it } from 'vitest'
import { evaluateExpression } from './formulaService'

describe('evaluateExpression', () => {
  it('evaluates basic arithmetic with placeholders', () => {
    const result = evaluateExpression('{{hours}} * {{rate}}', {
      hours: 2.5,
      rate: 200,
    })

    expect(result).toBe(500)
  })

  it('handles percentage literals', () => {
    const result = evaluateExpression('{{gross}} * 10%', {
      gross: 900,
    })

    expect(result).toBe(90)
  })
})
