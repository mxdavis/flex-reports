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

type Token = { type: 'number'; value: number } | { type: 'op'; value: string }

function tokenize(input: string): Token[] {
  const tokens: Token[] = []
  let index = 0

  while (index < input.length) {
    const char = input[index]

    if (/\s/.test(char)) {
      index += 1
      continue
    }

    if ('+-*/()'.includes(char)) {
      tokens.push({ type: 'op', value: char })
      index += 1
      continue
    }

    if (/[0-9.]/.test(char)) {
      let numeral = ''
      while (index < input.length && /[0-9.]/.test(input[index])) {
        numeral += input[index]
        index += 1
      }
      tokens.push({ type: 'number', value: Number(numeral) })
      continue
    }

    throw new Error(`Unexpected character: ${char}`)
  }

  return tokens
}

// Recursive-descent evaluator over the allowed operators (+ - * /) and
// parentheses. Kept intentionally tiny so we never fall back to eval/Function.
function evaluateTokens(tokens: Token[]): number {
  let position = 0

  const peek = (): Token | undefined => tokens[position]

  function consume(): Token {
    const token = tokens[position]
    if (!token) {
      throw new Error('Unexpected end of expression')
    }
    position += 1
    return token
  }

  function parseExpression(): number {
    let value = parseTerm()
    for (;;) {
      const token = peek()
      if (token?.type === 'op' && (token.value === '+' || token.value === '-')) {
        consume()
        const right = parseTerm()
        value = token.value === '+' ? value + right : value - right
      } else {
        return value
      }
    }
  }

  function parseTerm(): number {
    let value = parseFactor()
    for (;;) {
      const token = peek()
      if (token?.type === 'op' && (token.value === '*' || token.value === '/')) {
        consume()
        const right = parseFactor()
        value = token.value === '*' ? value * right : value / right
      } else {
        return value
      }
    }
  }

  function parseFactor(): number {
    const token = peek()
    if (!token) {
      throw new Error('Unexpected end of expression')
    }

    if (token.type === 'op' && (token.value === '+' || token.value === '-')) {
      consume()
      const operand = parseFactor()
      return token.value === '-' ? -operand : operand
    }

    if (token.type === 'op' && token.value === '(') {
      consume()
      const value = parseExpression()
      const closing = consume()
      if (closing.type !== 'op' || closing.value !== ')') {
        throw new Error('Expected closing parenthesis')
      }
      return value
    }

    if (token.type === 'number') {
      consume()
      return token.value
    }

    throw new Error(`Unexpected token: ${String(token.value)}`)
  }

  const result = parseExpression()
  if (position !== tokens.length) {
    throw new Error('Unexpected trailing tokens')
  }
  return result
}

export function evaluateFormula(
  expression: string | undefined,
  context: FormulaContext,
): number {
  if (!expression) {
    return 0
  }

  const prepared = injectTokens(normalizePercent(expression), context)

  if (!SAFE_EXPRESSION_REGEX.test(prepared)) {
    return 0
  }

  try {
    const result = evaluateTokens(tokenize(prepared))
    return Number.isFinite(result) ? result : 0
  } catch {
    // A malformed-but-allowed expression (e.g. `1..2`) parses to NaN or throws;
    // treat it like a non-finite result so callers never crash.
    return 0
  }
}
