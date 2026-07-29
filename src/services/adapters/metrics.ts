import type { ReportRow } from './types'

// Source-agnostic report metrics computed over rows. These are stand-ins until
// the pivot/aggregation engine lands.
export function getTotalRevenue(rows: ReportRow[]): number {
  return rows.reduce((sum, row) => sum + row.total, 0)
}

export function getRevenueByPerson(rows: ReportRow[]): Array<{
  personName: string
  totalRevenue: number
}> {
  const totals = new Map<string, number>()

  for (const row of rows) {
    totals.set(row.personName, (totals.get(row.personName) ?? 0) + row.total)
  }

  return Array.from(totals.entries())
    .map(([personName, totalRevenue]) => ({ personName, totalRevenue }))
    .sort((a, b) => b.totalRevenue - a.totalRevenue)
}
