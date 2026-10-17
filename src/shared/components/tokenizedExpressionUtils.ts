export type TriggerState = {
  start: number
  query: string
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
