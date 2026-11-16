export type FieldPath = readonly string[]

const SIMPLE_SEGMENT = /^[A-Za-z_$][A-Za-z0-9_$]*$/

export function isFieldPath(value: unknown): value is string[] {
  return Array.isArray(value) && value.length > 0 && value.every((segment) => typeof segment === 'string')
}

// Dots mean nesting. JSON arrays keep literal dots, empty keys and punctuation unambiguous.
export function formatFieldPath(path: FieldPath): string {
  return path.every((segment) => SIMPLE_SEGMENT.test(segment)) ? path.join('.') : JSON.stringify(path)
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
