import type { DisplayType, SourceColumn } from './types'

export function getDefaultDisplayType(sourceKey: SourceColumn['key']): DisplayType {
  const normalizedKey = String(sourceKey).toLowerCase()
  if (normalizedKey === 'hours' || normalizedKey === 'rate' || normalizedKey === 'total') {
    return 'decimal'
  }

  return 'string'
}
