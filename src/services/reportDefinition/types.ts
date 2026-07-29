import type { ReportRow } from '../adapters'

export type SourceColumn = {
  id: string
  key: keyof ReportRow
  defaultLabel: string
}

export type ReportField = {
  id: string
  label: string
  columnId: string
}

export type ReportData = {
  version: 1
  fields: ReportField[]
  columnLabels: Record<string, string>
}
