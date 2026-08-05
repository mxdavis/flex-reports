import defaultSeed from '../billing.seed.json'
import { evaluateFormula } from '../../services/formula/evaluateFormula'
import type { FormulaContext } from '../../services/formula/evaluateFormula'
import type { BillingSeed, DataSource, ReportRow } from '../../services/adapters/types'

// A DataSource backed by static seed JSON. It stands in for a real host adapter
// so the rest of the app can be built and tested against realistic rows.
export interface SeedDataSource extends DataSource {
  getSeed(): BillingSeed
}

export function createSeedDataSource(
  seed: BillingSeed = defaultSeed as BillingSeed,
): SeedDataSource {
  const formulas = seed.formulas.reduce<Record<string, string>>(
    (memo, formula) => {
      memo[formula.label] = formula.expression
      return memo
    },
    {},
  )

  const peopleById = new Map(
    seed.personBilling.map((person) => [person.id, person.name]),
  )

  const clientsById = new Map(seed.client.map((client) => [client.id, client]))

  const reportedColumns = new Set<string>()
  function evaluateColumn(formulaLabel: string, context: FormulaContext): number {
    const result = evaluateFormula(formulas[formulaLabel], context)
    if (result.ok) {
      return result.value
    }

    if (!reportedColumns.has(formulaLabel)) {
      reportedColumns.add(formulaLabel)
      console.error(
        `[seedDataSource] Column "${formulaLabel}" formula error: ${result.message}`,
      )
    }
    return Number.NaN
  }

  function getReportRows(): ReportRow[] {
    return seed.personClientTime.map((entry) => {
      const client = clientsById.get(entry.clientId)
      const grossFees = evaluateColumn('grossFees', {
        hours: entry.timeWorked,
        rate: entry.rate,
      })
      const writeDown = evaluateColumn('writeDown', { grossFees })
      const netFees = evaluateColumn('netFees', { grossFees, writeDown })

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

  return {
    getReportRows,
    getSeed: () => seed,
  }
}
