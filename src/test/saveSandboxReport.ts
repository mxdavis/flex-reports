import { createSeedDataSource } from '../seeds/factory/createSeedDataSource'
import { saveSandboxDefinition } from '../services/reportDefinition/storage'
import { reportWithColumns } from './reportWithColumns'

// Saves a sandbox report showing every sample field, so sandbox tests start
// with columns (a new report starts with none).
export function saveSandboxReportWithColumns(): void {
  const source = createSeedDataSource()
  saveSandboxDefinition(reportWithColumns(source.getSchema(), source.getSeed().formulas))
}
