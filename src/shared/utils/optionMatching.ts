function normalize(value: string): string {
  return value.trim().toLowerCase()
}

// Unique options containing the query, case-insensitively, in their given order.
export function filterOptions(options: string[], query: string): string[] {
  const normalizedQuery = normalize(query)
  const uniqueOptions = Array.from(new Set(options))
  if (!normalizedQuery) return uniqueOptions
  return uniqueOptions.filter((option) => normalize(option).includes(normalizedQuery))
}

// The option typed into the box, ignoring case. When options differ only by
// case, the exact spelling wins; if it's still unclear, nothing matches.
export function findTypedOption(typed: string, options: string[]): string | null {
  const text = typed.trim()
  if (!text) return null
  if (options.includes(text)) return text
  const matches = options.filter((option) => normalize(option) === normalize(text))
  return matches.length === 1 ? matches[0] : null
}
