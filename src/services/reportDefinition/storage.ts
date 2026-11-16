import type { ReportFormula } from '../adapters'
import { generateDefaultReportDefinition, normalizeReportDefinition } from './normalize'
import type { ReportDefinition, SourceColumn } from './types'

// Sandbox mode only. In host mode the definition comes in as a prop and goes
// out through onSave; nothing is written to the browser.
export const SANDBOX_DEFINITION_STORAGE_KEY = 'flex-reports.sandbox.reportDefinition.v1'

export function loadSandboxDefinition(
  sourceColumns: SourceColumn[],
  seedFormulas: ReportFormula[],
): ReportDefinition {
  try {
    const raw = window.localStorage.getItem(SANDBOX_DEFINITION_STORAGE_KEY)
    if (!raw) return generateDefaultReportDefinition(sourceColumns, seedFormulas)
    return normalizeReportDefinition(JSON.parse(raw), sourceColumns, seedFormulas)
  } catch (error) {
    console.error('[flex-reports] Could not load the sandbox report definition; using defaults.', error)
    return generateDefaultReportDefinition(sourceColumns, seedFormulas)
  }
}

export function saveSandboxDefinition(definition: ReportDefinition): void {
  window.localStorage.setItem(SANDBOX_DEFINITION_STORAGE_KEY, JSON.stringify(definition))
}
