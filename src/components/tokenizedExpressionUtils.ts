export type TriggerState = {
  start: number
  query: string
}

function normalize(value: string): string {
  return value.trim().toLowerCase()
}

export function getTriggerState(value: string, cursor: number): TriggerState | null {
  const cappedCursor = Math.max(0, Math.min(cursor, value.length))
  const prefix = value.slice(0, cappedCursor)
  const openIndex = prefix.lastIndexOf('{{')
  const closeIndex = prefix.lastIndexOf('}}')

  if (openIndex === -1 || openIndex < closeIndex) {
    return null
  }

  const query = prefix.slice(openIndex + 2)
  if (query.includes('{') || query.includes('}')) {
    return null
  }

  return {
    start: openIndex,
    query,
  }
}

export function filterTokenOptions(options: string[], query: string): string[] {
  const normalizedQuery = normalize(query)
  const uniqueOptions = Array.from(new Set(options))

  if (!normalizedQuery) {
    return uniqueOptions
  }

  return uniqueOptions.filter((option) => normalize(option).includes(normalizedQuery))
}
