import type { ReportRow } from '../adapters'

export type SourceColumn = {
  id: string
  key: keyof ReportRow
  defaultLabel: string
}

export type ReportField = {
  id: string
  label: string
  sourceKey: keyof ReportRow
}

export type ReportData = {
  version: 3
  fields: ReportField[]
}
