import { beforeEach, describe, expect, it, vi } from 'vitest'
import { generateDefaultReportDefinition } from '../services/reportDefinition/normalize'
import { installMemoryStorage } from '../test/memoryStorage'
import { clearSavedReport, loadSavedReport, SAVED_REPORT_STORAGE_KEY, saveReport } from './savedReport'

describe('the app\'s saved report', () => {
  beforeEach(() => {
    installMemoryStorage()
  })

  it('has nothing saved at first', () => {
    expect(loadSavedReport()).toBeUndefined()
  })

  it('saves, reloads and clears a report', () => {
    const definition = { ...generateDefaultReportDefinition(), sheetName: 'Scores' }

    saveReport(definition)
    expect(loadSavedReport()).toEqual(definition)

    clearSavedReport()
    expect(window.localStorage.getItem(SAVED_REPORT_STORAGE_KEY)).toBeNull()
  })

  it('starts a new report, and logs, when the stored report is corrupt', () => {
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => undefined)
    window.localStorage.setItem(SAVED_REPORT_STORAGE_KEY, '{not json')

    expect(loadSavedReport()).toBeUndefined()
    expect(errorSpy).toHaveBeenCalled()
    errorSpy.mockRestore()
  })

  it('throws a plain message when the browser won\'t store it', () => {
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => undefined)
    vi.spyOn(window.localStorage, 'setItem').mockImplementation(() => {
      throw new DOMException('Quota exceeded', 'QuotaExceededError')
    })

    expect(() => saveReport(generateDefaultReportDefinition())).toThrow('This browser won\'t save the report.')
    errorSpy.mockRestore()
  })
})
