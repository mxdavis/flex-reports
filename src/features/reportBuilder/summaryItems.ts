import type { ReportRow } from '../../services/adapters'
import type { ReportField } from '../../services/reportDefinition/types'
import { getAggregationLabel } from './config'

type SummaryItem = {
  label: string
  value: string
}

type BuildSummaryItemsParams = {
  fields: ReportField[]
  rows: ReportRow[]
  formatFieldTotal: (rows: ReportRow[], field: ReportField) => string
}

export function buildSummaryItems({ fields, rows, formatFieldTotal }: BuildSummaryItemsParams): SummaryItem[] {
  return fields
    .filter((field) => field.aggregation !== 'none')
    .map((field) => ({
      label: `${field.label} (${getAggregationLabel(field.aggregation)})`,
      value: formatFieldTotal(rows, field) || '0',
    }))
}
