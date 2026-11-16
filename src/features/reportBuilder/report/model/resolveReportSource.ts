import { createRecordsDataSource } from '../../../../services/adapters/recordsDataSource'
import { formatFieldPath, getColumnPath } from '../../../../services/adapters/fieldPath'
import type { ReportFormula, ReportRow, SandboxData, SchemaField } from '../../../../services/adapters'

export type ReportSource = {
  isSandbox: boolean
  schema: SchemaField[]
  rows: ReportRow[]
  seedFormulas: ReportFormula[]
  error?: string
  // Fields left out because they hold several entries per row.
  skippedFields: string[]
}

// Sandbox mode runs on the loaded sample data; otherwise the host's rows.
// Without a schema, discover every key and let the user choose its display type.
export function resolveReportSource(rows: ReportRow[] = [], schema?: SchemaField[], sandbox?: SandboxData): ReportSource {
  if (sandbox) {
    return { isSandbox: true, schema: sandbox.schema, rows: sandbox.rows, seedFormulas: sandbox.formulas, skippedFields: [] }
  }
  try {
    const source = createRecordsDataSource(rows)
    // Every column gets its path, and its key in the one form formulas use.
    const columns = (schema ?? source.getSchema()).map((column) => {
      const path = getColumnPath(column)
      return { ...column, key: formatFieldPath(path), path }
    })
    return { isSandbox: false, rows: source.getReportRows(), schema: columns, seedFormulas: [], skippedFields: source.getSkippedFields() }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Could not read report data.'
    return { isSandbox: false, rows: [], schema: schema ?? [], seedFormulas: [], skippedFields: [], error: message }
  }
}
