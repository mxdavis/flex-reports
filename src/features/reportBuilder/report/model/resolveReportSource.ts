import type { ReportFormula, ReportRow, SandboxData, SchemaDataType, SchemaField } from '../../../../services/adapters'

export type ReportSource = {
  isSandbox: boolean
  schema: SchemaField[]
  rows: ReportRow[]
  seedFormulas: ReportFormula[]
}

function inferDataType(value: unknown): SchemaDataType {
  if (typeof value === 'number') return 'number'
  if (value instanceof Date) return 'date'
  if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}/.test(value)) return 'date'
  return 'string'
}

function inferSchema(rows: ReportRow[]): SchemaField[] {
  const first = rows[0]
  if (!first) return []
  return Object.keys(first)
    .filter((key) => key !== 'id')
    .map((key) => ({ id: key, key, label: key, dataType: inferDataType(first[key]) }))
}

// Sandbox mode runs on the loaded sample data; otherwise the host's rows.
// Rows without a schema still render by inferring columns from the first row.
export function resolveReportSource(rows: ReportRow[] = [], schema?: SchemaField[], sandbox?: SandboxData): ReportSource {
  if (sandbox) {
    return { isSandbox: true, schema: sandbox.schema, rows: sandbox.rows, seedFormulas: sandbox.formulas }
  }
  return { isSandbox: false, rows, schema: schema ?? inferSchema(rows), seedFormulas: [] }
}
