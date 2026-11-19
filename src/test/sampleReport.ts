import sampleRecords from '../../public/sample-data.json'
import type { ReportFormula, ReportRow } from '../services/adapters'
import { createRecordsDataSource } from '../services/adapters/recordsDataSource'
import type { DisplayType, ReportDefinition } from '../services/reportDefinition/types'
import { reportWithColumns } from './reportWithColumns'

// The app's sample endpoint, read from the same file the app serves.
export const SAMPLE_RECORDS: ReportRow[] = sampleRecords

// A saved report on the sample records, as an editor might set one up: every
// field as a column, the money and hours columns typed, and three formulas.
export const SAMPLE_REPORT_FORMULAS: ReportFormula[] = [
  { label: 'grossFees', expression: '{{hours}} * {{rate}}' },
  { label: 'writeDown', expression: '{{%grossFees}} * 10%' },
  { label: 'netFees', expression: '{{%grossFees}} - {{%writeDown}}' },
]

const NUMBER_COLUMNS: Record<string, DisplayType> = { hours: 'decimal', rate: 'currency', total: 'currency' }

export function sampleReportDefinition(): ReportDefinition {
  const definition = reportWithColumns(createRecordsDataSource(SAMPLE_RECORDS).getSchema(), SAMPLE_REPORT_FORMULAS)
  return {
    ...definition,
    fields: definition.fields.map((field) => {
      const displayType = NUMBER_COLUMNS[field.sourceKey]
      return displayType ? { ...field, displayType, aggregation: 'sum' } : field
    }),
  }
}

// Props for a builder showing the sample report to an editor who can save.
export function sampleReportProps() {
  return { rows: SAMPLE_RECORDS, reportDefinition: sampleReportDefinition(), onSave: () => undefined }
}
