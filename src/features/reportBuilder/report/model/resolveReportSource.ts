import { createRecordsDataSource } from '../../../../services/adapters/recordsDataSource'
import { formatFieldPath, getColumnPath } from '../../../../services/adapters/fieldPath'
import type { ReportRow, SchemaField } from '../../../../services/adapters'

export type ReportSource = {
  schema: SchemaField[]
  rows: ReportRow[]
  error?: string
  // Fields left out because they hold several entries per row.
  skippedFields: string[]
}

// Without a schema, discover every key and let the user choose its display type.
export function resolveReportSource(rows: ReportRow[] = [], schema?: SchemaField[]): ReportSource {
  try {
    const source = createRecordsDataSource(rows)
    // Every column gets its path, and its key in the one form formulas use.
    const columns = (schema ?? source.getSchema()).map((column) => {
      const path = getColumnPath(column)
      return { ...column, key: formatFieldPath(path), path }
    })
    return { rows: source.getReportRows(), schema: columns, skippedFields: source.getSkippedFields() }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Could not read report data.'
    return { rows: [], schema: schema ?? [], skippedFields: [], error: message }
  }
}
