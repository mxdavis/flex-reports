import type { ReportFormula } from '../services/adapters'
import { createFieldColumn, generateDefaultReportDefinition } from '../services/reportDefinition/normalize'
import { MAX_REPORT_COLUMNS } from '../services/reportDefinition/rules'
import type { ReportDefinition, SourceColumn } from '../services/reportDefinition/types'

// A saved report showing the schema's fields as columns, for tests that need
// a report to work with (a new report starts with none).
export function reportWithColumns(schema: SourceColumn[], formulas: ReportFormula[] = []): ReportDefinition {
  return {
    ...generateDefaultReportDefinition(formulas),
    fields: schema.slice(0, MAX_REPORT_COLUMNS).map((column) => createFieldColumn(column, column.id)),
  }
}
