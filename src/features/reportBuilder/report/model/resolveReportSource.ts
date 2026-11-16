import { createRecordsDataSource } from '../../../../services/adapters/recordsDataSource'
import type { ReportFormula, ReportRow, SandboxData, SchemaField } from '../../../../services/adapters'

export type ReportSource = {
  isSandbox: boolean
  schema: SchemaField[]
  rows: ReportRow[]
  seedFormulas: ReportFormula[]
  error?: string
}

// Sandbox mode runs on the loaded sample data; otherwise the host's rows.
// Without a schema, discover every key and let the user choose its display type.
export function resolveReportSource(rows: ReportRow[] = [], schema?: SchemaField[], sandbox?: SandboxData): ReportSource {
  if (sandbox) {
    return { isSandbox: true, schema: sandbox.schema, rows: sandbox.rows, seedFormulas: sandbox.formulas }
  }
  try {
    const source = createRecordsDataSource(rows)
    return { isSandbox: false, rows: source.getReportRows(), schema: schema ?? source.getSchema(), seedFormulas: [] }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Could not read report data.'
    return { isSandbox: false, rows: [], schema: schema ?? [], seedFormulas: [], error: message }
  }
}
