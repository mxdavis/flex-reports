import type { PivotRow, TimeslipRow } from '../../models/reportTypes'

export function pivotByEmployee(rows: TimeslipRow[]): PivotRow[] {
  const grouped = new Map<string, PivotRow>()

  for (const row of rows) {
    const entry = grouped.get(row.employee)
    const fee = row.hours * row.rate

    if (entry) {
      entry.totalHours += row.hours
      entry.grossFees += fee
      continue
    }

    grouped.set(row.employee, {
      group: row.employee,
      totalHours: row.hours,
      grossFees: fee,
    })
  }

  return Array.from(grouped.values()).sort((a, b) => b.grossFees - a.grossFees)
}
