import defaultSeed from '../billing.seed.json'
import type {
  BillingSeed,
  DataSource,
  ReportRow,
  SchemaField,
} from '../../services/adapters/types'

// A DataSource backed by static seed JSON. It stands in for a real host adapter
// so the rest of the app can be built and tested against realistic rows.
export interface SeedDataSource extends DataSource {
  getSeed(): BillingSeed
}

export function createSeedDataSource(
  seed: BillingSeed = defaultSeed as BillingSeed,
): SeedDataSource {
  const schema: SchemaField[] = [
    { id: 'workDate', key: 'workDate', label: 'Work Date', dataType: 'date' },
    { id: 'personName', key: 'personName', label: 'Person', dataType: 'string' },
    { id: 'clientName', key: 'clientName', label: 'Client', dataType: 'string' },
    { id: 'task', key: 'task', label: 'Task', dataType: 'string' },
    { id: 'hours', key: 'hours', label: 'Hours', dataType: 'number' },
    { id: 'rate', key: 'rate', label: 'Rate', dataType: 'currency' },
    { id: 'total', key: 'total', label: 'Total', dataType: 'currency' },
  ]

  const peopleById = new Map(
    seed.personBilling.map((person) => [person.id, person.name]),
  )

  const clientsById = new Map(seed.client.map((client) => [client.id, client]))

  function getReportRows(): ReportRow[] {
    return seed.personClientTime.map((entry) => {
      const client = clientsById.get(entry.clientId)

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
      }
    })
  }

  return {
    getReportRows,
    getSchema: () => schema,
    getSeed: () => seed,
  }
}
