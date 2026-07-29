import type { DisplayType, SourceColumn } from './types'

export function getDefaultDisplayType(_sourceKey: SourceColumn['key']): DisplayType {
  return 'string'
}
