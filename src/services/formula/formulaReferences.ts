export type FormulaReference = {
  start: number
  end: number | null
  reference: string
}

// A quoted path segment may contain {{ or }}. Only unquoted delimiters close a token.
export function getFormulaReferences(expression: string): FormulaReference[] {
  const references: FormulaReference[] = []
  let offset = 0
  while (offset < expression.length) {
    const start = expression.indexOf('{{', offset)
    if (start === -1) break
    const contentStart = start + 2
    const isArrayPath = expression.slice(contentStart).trimStart().startsWith('[')
    let quoted = false
    let escaped = false
    let cursor = contentStart
    for (; cursor < expression.length; cursor += 1) {
      const character = expression[cursor]
      if (escaped) escaped = false
      else if (quoted && character === '\\') escaped = true
      else if (isArrayPath && character === '"') quoted = !quoted
      else if (!quoted && expression.startsWith('}}', cursor)) break
    }
    const end = cursor < expression.length ? cursor + 2 : null
    references.push({ start, end, reference: expression.slice(contentStart, cursor) })
    if (end === null) break
    offset = end
  }
  return references
}
