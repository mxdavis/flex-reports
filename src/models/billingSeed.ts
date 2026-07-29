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
  columnId: string
  label: string
  expression: string
}

export type BillingSeed = {
  personBilling: SeedPersonBilling[]
  client: SeedClient[]
  personClientTime: SeedPersonClientTime[]
  formulas: SeedFormula[]
}

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