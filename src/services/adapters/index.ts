import { createSeedDataSource } from '../../seeds/factory/createSeedDataSource'
import type { ReportFormula, ReportRow, SchemaField } from './types'

export type { ReportFormula, ReportRow, SchemaDataType, SchemaField } from './types'

export type SandboxData = {
  schema: SchemaField[]
  rows: ReportRow[]
  formulas: ReportFormula[]
}

let sandboxData: SandboxData | null = null

// Sandbox mode only: mock data used when the host passes no rows, so the
// report flow stays runnable for local development and repro.
export function getSandboxData(): SandboxData {
  if (!sandboxData) {
    const source = createSeedDataSource()
    sandboxData = {
      schema: source.getSchema(),
      rows: source.getReportRows(),
      formulas: source.getSeed().formulas,
    }
  }
  return sandboxData
}
