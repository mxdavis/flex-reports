import type { ReportFormula, ReportRow, SchemaField } from './types'

export type { ReportFormula, ReportRow, SchemaDataType, SchemaField } from './types'

export type SandboxData = {
  schema: SchemaField[]
  rows: ReportRow[]
  formulas: ReportFormula[]
}

let sandboxDataPromise: Promise<SandboxData> | null = null

// Sandbox mode only: mock data used when the host passes no rows. It's loaded
// with a dynamic import, so the seeds ship as a separate chunk that host apps
// passing their own rows never download.
export function loadSandboxData(): Promise<SandboxData> {
  sandboxDataPromise ??= import('../../seeds/factory/createSeedDataSource').then(({ createSeedDataSource }) => {
    const source = createSeedDataSource()
    return {
      schema: source.getSchema(),
      rows: source.getReportRows(),
      formulas: source.getSeed().formulas,
    }
  })
  return sandboxDataPromise
}
