type FormulaContext = Record<string, number>

const TOKEN_REGEX = /\{\{\s*([a-zA-Z0-9_.-]+)\s*\}\}/g
const SAFE_EXPRESSION_REGEX = /^[0-9+\-*/().\s]+$/

function normalizePercentLiterals(expression: string): string {
  return expression.replace(/(\d+(?:\.\d+)?)%/g, '($1/100)')
}

function injectValues(expression: string, context: FormulaContext): string {
  return expression.replace(TOKEN_REGEX, (_, token: string) => {
    const value = context[token]
    return Number.isFinite(value) ? String(value) : '0'
  })
}

export function evaluateExpression(expression: string, context: FormulaContext): number {
  const prepared = injectValues(normalizePercentLiterals(expression), context)

  if (!SAFE_EXPRESSION_REGEX.test(prepared)) {
    throw new Error('Expression contains unsupported characters')
  }

  const result = Function(`return (${prepared})`)()
  return typeof result === 'number' && Number.isFinite(result) ? result : 0
}
