export type TimeslipRow = {
  id: string
  workDate: string
  employee: string
  client: string
  task: string
  hours: number
  rate: number
}

export type PivotRow = {
  group: string
  totalHours: number
  grossFees: number
}
