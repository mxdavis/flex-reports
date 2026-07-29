export type FormulaContext = Record<string, number>

const TOKEN_REGEX = /\{\{\s*([a-zA-Z0-9_.-]+)\s*\}\}/g
const SAFE_EXPRESSION_REGEX = /^[0-9+\-*/().\s]+$/

function normalizePercent(expression: string): string {
  return expression.replace(/(\d+(?:\.\d+)?)%/g, '($1/100)')
}

function injectTokens(expression: string, context: FormulaContext): string {
  return expression.replace(TOKEN_REGEX, (_, token: string) => {
    const value = context[token]
    return Number.isFinite(value) ? String(value) : '0'
  })
}

export function evaluateFormula(
  expression: string,
  context: FormulaContext,
): number {
  const prepared = injectTokens(normalizePercent(expression), context)

  if (!SAFE_EXPRESSION_REGEX.test(prepared)) {
    throw new Error('Unsupported formula syntax')
  }

  const result = Function(`return (${prepared})`)()
  if (typeof result !== 'number' || !Number.isFinite(result)) {
    return 0
  }

  return result
}
