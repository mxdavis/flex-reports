import type { ReportRow } from '../adapters'

export type SourceColumn = {
  id: string
  key: keyof ReportRow | string
  defaultLabel: string
}

export type DisplayType = 'currency' | 'decimal' | 'percent' | 'date' | 'string'

export type ReportField = {
  id: string
  label: string
  sourceKey: string
  displayType: DisplayType
}

export type ReportData = {
  version: 4
  fields: ReportField[]
}
