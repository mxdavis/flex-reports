// The option typed into the box, ignoring case. When options differ only by
// case, the exact spelling wins; if it's still unclear, nothing matches.
export function findTypedOption(typed: string, options: string[]): string | null {
  const text = typed.trim()
  if (!text) return null
  if (options.includes(text)) return text
  const matches = options.filter((option) => option.toLowerCase() === text.toLowerCase())
  return matches.length === 1 ? matches[0] : null
}
