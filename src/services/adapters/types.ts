// Host data stays unchanged; rendering keys are managed separately.
export type ReportRow = Readonly<Record<string, unknown>>

export type SchemaDataType = 'string' | 'number' | 'date' | 'currency'

// Describes one column available on the host's rows.
export type SchemaField = {
  id: string
  key: string
  path?: readonly string[]
  label: string
  dataType: SchemaDataType
}

export type ReportFormula = {
  label: string
  expression: string
}
