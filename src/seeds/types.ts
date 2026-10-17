import type { ReportFormula } from '../services/adapters/types'

// Mock fixture types for sandbox mode only. They mimic records a host app
// might send in; nothing outside src/seeds should depend on this shape.
export type SeedPerson = {
  id: string
  name: string
}

export type SeedClient = {
  id: string
  name: string
  originatingPerson: string
}

export type SeedTimeEntry = {
  id: string
  workDate: string
  personId: string
  clientId: string
  task: string
  timeWorked: number
  rate: number
  total: number
}

export type BillingSeed = {
  personBilling: SeedPerson[]
  client: SeedClient[]
  personClientTime: SeedTimeEntry[]
  formulas: ReportFormula[]
}
