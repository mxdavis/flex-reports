import {
  createSeedDataSource,
  type SeedDataSource,
} from '../../seeds/factory/createSeedDataSource'
import type { BillingSeed, DataSource, ReportRow, SchemaField } from './types'

export type { BillingSeed, DataSource, ReportRow, SchemaDataType } from './types'
export type { SeedFormula } from './types'
export type { SchemaField } from './types'

type DataSourceKind = 'seed'

function resolveKind(): DataSourceKind {
  const configured = import.meta.env.VITE_DATA_SOURCE ?? 'seed'
  if (configured === 'seed') {
    return 'seed'
  }

  throw new Error(
    `Unknown VITE_DATA_SOURCE "${configured}". Supported values: seed`,
  )
}

let seedSource: SeedDataSource | null = null

function getSeedSource(): SeedDataSource {
  if (!seedSource) {
    seedSource = createSeedDataSource()
  }
  return seedSource
}

// Factory: selects the active data source from env. Today only the mock seed is
// wired up; a real host adapter becomes another branch here.
export function getDataSource(): DataSource {
  switch (resolveKind()) {
    case 'seed':
      return getSeedSource()
  }
}

export function getReportRows(): ReportRow[] {
  return getDataSource().getReportRows()
}

export function getSchema(): SchemaField[] {
  return getDataSource().getSchema()
}

// Mock-only helper for the seed playground UI (raw counts + formulas).
export function getBillingSeed(): BillingSeed {
  return getSeedSource().getSeed()
}
