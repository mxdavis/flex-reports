// Shape of a single row the report engine works over. In production this comes
// from the host app via a DataSource; here it is produced by the seed adapter.
export type ReportRow = {
  id: string
  workDate: string
  personId: string
  personName: string
  clientId: string
  clientName: string
  originatingPersonId: string
  task: string
  hours: number
  rate: number
  total: number
  grossFees: number
  writeDown: number
  netFees: number
}

// Mock fixture types. These mimic the records a host billing app would send in,
// so we can build and test the report flow without a real data source.
export type SeedPersonBilling = {
  id: string
  name: string
}

export type SeedClient = {
  id: string
  name: string
  originatingPerson: string
}

export type SeedPersonClientTime = {
  id: string
  workDate: string
  personId: string
  clientId: string
  task: string
  timeWorked: number
  rate: number
  total: number
}

export type SeedFormula = {
  label: string
  expression: string
}

export type BillingSeed = {
  personBilling: SeedPersonBilling[]
  client: SeedClient[]
  personClientTime: SeedPersonClientTime[]
  formulas: SeedFormula[]
}

// Pluggable seam: a host app implements this to feed rows into the report
// engine. The bundled SeedDataSource mimics a host by replaying mock JSON.
export interface DataSource {
  getReportRows(): ReportRow[]
}
