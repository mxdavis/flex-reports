import type { ReportRow } from '../adapters'

import type { SchemaDataType } from '../adapters'

export type SourceColumn = {
  id: string
  key: keyof ReportRow | string
  label: string
  dataType: SchemaDataType
}

export type DisplayType = 'currency' | 'number' | 'decimal' | 'percent' | 'date' | 'string'

export type ChipAggregationMode = 'none' | 'sum' | 'avg' | 'count'

export type ReportField = {
  id: string
  label: string
  sourceKey: string
  displayType: DisplayType
  chipAggregation: ChipAggregationMode
  currencySymbol: string
}

export type ReportData = {
  version: 4
  fields: ReportField[]
}
