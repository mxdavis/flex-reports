import { getFormulaReferences } from '../../services/formula/formulaReferences'

export type TriggerState = {
  start: number
  query: string
}

export function getTriggerState(value: string, cursor: number): TriggerState | null {
  const cappedCursor = Math.max(0, Math.min(cursor, value.length))
  const prefix = value.slice(0, cappedCursor)
  const token = getFormulaReferences(prefix).at(-1)
  return token?.end === null ? { start: token.start, query: token.reference } : null
}
