import type { ReportRow } from '../adapters'

export type SourceColumn = {
  id: string
  key: keyof ReportRow
  defaultLabel: string
}

export type DisplayType = 'currency' | 'decimal' | 'percent' | 'date' | 'string'

export type ReportField = {
  id: string
  label: string
  sourceKey: keyof ReportRow
  displayType: DisplayType
  valueTemplate?: string
}

export type ReportData = {
  version: 4
  fields: ReportField[]
}
