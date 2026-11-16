export type FieldPath = readonly string[]

// A name that reads back unchanged when written plainly, e.g. "Unit Price" or
// "Amount (2)". Dots (nesting), brackets, braces, quotes and backslashes need
// the bracket form, as do names with spaces at either end (references are trimmed).
const PLAIN_SEGMENT = /^[^\s.{}[\]"\\](?:[^.{}[\]"\\]*[^\s.{}[\]"\\])?$/

export function isFieldPath(value: unknown): value is string[] {
  return Array.isArray(value) && value.length > 0 && value.every((segment) => typeof segment === 'string')
}

// Dots mean nesting. JSON arrays keep literal dots, empty keys and punctuation
// unambiguous. A leading % marks a formula, so a field named that way is bracketed.
export function formatFieldPath(path: FieldPath): string {
  const isPlain = !path[0]?.startsWith('%') && path.every((segment) => PLAIN_SEGMENT.test(segment))
  return isPlain ? path.join('.') : JSON.stringify(path)
}

export function parseFieldPath(reference: string): FieldPath | null {
  const text = reference.trim()
  if (!text) return null
  if (text.startsWith('[')) {
    try {
      const path: unknown = JSON.parse(text)
      return isFieldPath(path) ? path : null
    } catch {
      return null
    }
  }
  const path = text.split('.')
  return path.every((segment) => segment.length > 0) ? path : null
}

export function readFieldPath(record: unknown, path: FieldPath): unknown {
  if (path.length === 0) return undefined
  let value = record
  for (const segment of path) {
    if (!value || typeof value !== 'object' || Array.isArray(value) || value instanceof Date
      || !Object.hasOwn(value, segment)) return undefined
    value = (value as Record<string, unknown>)[segment]
  }
  return Array.isArray(value) ? undefined : value
}
