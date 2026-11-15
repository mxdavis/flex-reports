import type { DisplayType, SourceColumn } from './types'

export function getDefaultDisplayType(source: Pick<SourceColumn, 'key' | 'dataType'>): DisplayType {
  if (source.dataType === 'currency') {
    return 'currency'
  }

  if (source.dataType === 'number') {
    return 'decimal'
  }

  if (source.dataType === 'date') {
    return 'date'
  }

  return 'string'
}
