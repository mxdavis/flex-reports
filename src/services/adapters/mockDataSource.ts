import seedData from '../../seeds/billing.seed.json'
import type { BillingSeed, ReportRow } from '../../models/billingSeed'
import { evaluateFormula } from '../formula/evaluateFormula'

const billingSeed = seedData as BillingSeed

function buildFormulaMap(): Record<string, string> {
  return billingSeed.formulas.reduce<Record<string, string>>((memo, formula) => {
    memo[formula.columnId] = formula.expression
    return memo
  }, {})
}

export function getBillingSeed(): BillingSeed {
  return billingSeed
}

export function getReportRows(): ReportRow[] {
  const formulas = buildFormulaMap()
  const peopleById = new Map(
    billingSeed.personBilling.map((person) => [person.id, person.name]),
  )

  const clientsById = new Map(
    billingSeed.client.map((client) => [client.id, client]),
  )

  return billingSeed.personClientTime.map((entry) => {
    const client = clientsById.get(entry.clientId)
    const grossFees = evaluateFormula(formulas.grossFees, {
      hours: entry.timeWorked,
      rate: entry.rate,
    })
    const writeDown = evaluateFormula(formulas.writeDown, {
      grossFees,
    })
    const netFees = evaluateFormula(formulas.netFees, {
      grossFees,
      writeDown,
    })

    return {
      id: entry.id,
      workDate: entry.workDate,
      personId: entry.personId,
      personName: peopleById.get(entry.personId) ?? 'Unknown',
      clientId: entry.clientId,
      clientName: client?.name ?? 'Unknown',
      originatingPersonId: client?.originatingPerson ?? '',
      task: entry.task,
      hours: entry.timeWorked,
      rate: entry.rate,
      total: entry.total,
      grossFees,
      writeDown,
      netFees,
    }
  })
}

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