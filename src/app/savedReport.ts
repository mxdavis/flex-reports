import type { ReportDefinition } from '../services/reportDefinition/types'

// The app saves its report in this browser. The package never touches
// browser storage: hosts save reports through onSave.
export const SAVED_REPORT_STORAGE_KEY = 'flex-reports.app.reportDefinition.v1'

// The saved report as stored; the builder repairs anything it can't use.
export function loadSavedReport(): ReportDefinition | undefined {
  try {
    const raw = window.localStorage.getItem(SAVED_REPORT_STORAGE_KEY)
    return raw ? JSON.parse(raw) as ReportDefinition : undefined
  } catch (error) {
    console.error('[flex-reports app] Could not read the saved report; starting a new one.', error)
    return undefined
  }
}

// Throws when the browser won't store it, so the builder shows the error.
export function saveReport(definition: ReportDefinition): void {
  try {
    window.localStorage.setItem(SAVED_REPORT_STORAGE_KEY, JSON.stringify(definition))
  } catch (error) {
    console.error('[flex-reports app] Could not save the report in this browser.', error)
    throw new Error('This browser won\'t save the report. Check that site data is allowed.', { cause: error })
  }
}

export function clearSavedReport(): void {
  try {
    window.localStorage.removeItem(SAVED_REPORT_STORAGE_KEY)
  } catch (error) {
    console.error('[flex-reports app] Could not clear the saved report.', error)
  }
}
