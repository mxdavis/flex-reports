// A single row the report engine works over. Rows come from the host app (or
// the sandbox seed) and can have any shape; only a unique `id` is required.
export type ReportRow = {
  id: string
  [key: string]: unknown
}

export type SchemaDataType = 'string' | 'number' | 'date' | 'currency'

// Describes one column available on the host's rows.
export type SchemaField = {
  id: string
  key: string
  label: string
  dataType: SchemaDataType
}

export type ReportFormula = {
  label: string
  expression: string
}
