export type FormulaContext = Record<string, number>

export type FormulaErrorCode =
  | 'empty-expression'
  | 'unsupported-syntax'
  | 'malformed-expression'
  | 'invalid-reference'

export type FormulaResult =
  | { ok: true; value: number }
  | { ok: false; code: FormulaErrorCode; message: string }

const TOKEN_REGEX = /\{\{([^{}]*?)\}\}/g
const SAFE_EXPRESSION_REGEX = /^[0-9eE+\-*/().\s]+$/

function normalizePercent(expression: string): string {
  return expression.replace(/((?:\d+(?:\.\d*)?|\.\d+)(?:[eE][+-]?\d+)?)%/g, '($1/100)')
}

export type FormulaResolver = (reference: string) => number

function injectTokens(expression: string, context: FormulaContext | FormulaResolver): string {
  return expression.replace(TOKEN_REGEX, (_, token: string) => {
    const reference = token.trim()
    const value = typeof context === 'function' ? context(reference) : context[reference]
    if (!Number.isFinite(value)) throw new Error('Unknown or invalid formula reference.')
    return `(${String(value)})`
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
      const numeral = /^(?:\d+(?:\.\d*)?|\.\d+)(?:[eE][+-]?\d+)?/.exec(input.slice(index))?.[0]
      if (!numeral) throw new Error('Invalid number')
      tokens.push({ type: 'number', value: Number(numeral) })
      index += numeral.length
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
  context: FormulaContext | FormulaResolver,
): FormulaResult {
  if (!expression) {
    return {
      ok: false,
      code: 'empty-expression',
      message: 'Formula is empty.',
    }
  }

  let prepared: string
  try {
    prepared = normalizePercent(injectTokens(expression, context))
  } catch {
    return { ok: false, code: 'invalid-reference', message: 'Unknown or invalid formula reference.' }
  }

  if (!SAFE_EXPRESSION_REGEX.test(prepared)) {
    return {
      ok: false,
      code: 'unsupported-syntax',
      message: `Formula "${expression}" contains unsupported characters.`,
    }
  }

  try {
    const value = evaluateTokens(tokenize(prepared))
    if (!Number.isFinite(value)) {
      return { ok: false, code: 'malformed-expression', message: 'Calculation is not a finite number.' }
    }
    return { ok: true, value }
  } catch (error) {
    // Non-throwing at runtime: a malformed-but-allowed expression (e.g. `1..2`)
    // is reported as an error result rather than crashing the caller.
    const detail = error instanceof Error ? error.message : String(error)
    return {
      ok: false,
      code: 'malformed-expression',
      message: `Formula "${expression}" is invalid: ${detail}`,
    }
  }
}
