import { beforeEach, describe, expect, it } from 'vitest'
import {
  generateDefaultReportData,
  loadReportData,
  REPORT_DATA_STORAGE_KEY,
  saveReportData,
} from './storage'
import type { SourceColumn } from './types'

const sourceColumns: SourceColumn[] = [
  { id: 'column1', key: 'workDate', defaultLabel: 'Date' },
  { id: 'column2', key: 'personName', defaultLabel: 'People' },
  { id: 'column3', key: 'clientName', defaultLabel: 'Clients' },
  { id: 'column4', key: 'task', defaultLabel: 'Task' },
  { id: 'column5', key: 'hours', defaultLabel: 'Hours' },
  { id: 'column6', key: 'rate', defaultLabel: 'Rate' },
  { id: 'column7', key: 'total', defaultLabel: 'Total' },
]

describe('reportDefinition storage', () => {
  beforeEach(() => {
    window.localStorage.clear()
  })

  it('creates a default reportData shape', () => {
    const defaults = generateDefaultReportData(sourceColumns)

    expect(defaults.version).toBe(1)
    expect(defaults.fields.length).toBe(7)
    expect(defaults.columnLabels.column1).toBe('Date')
  })

  it('persists and reloads reportData', () => {
    const defaults = generateDefaultReportData(sourceColumns)
    const updated = {
      ...defaults,
      fields: defaults.fields.map((field) => {
        if (field.id !== 'people') {
          return field
        }

        return {
          ...field,
          columnId: 'column3',
        }
      }),
      columnLabels: {
        ...defaults.columnLabels,
        column3: 'People Display',
      },
    }

    saveReportData(updated)
    const loaded = loadReportData(sourceColumns)

    expect(loaded.fields.find((field) => field.id === 'people')?.columnId).toBe('column3')
    expect(loaded.columnLabels.column3).toBe('People Display')
  })

  it('falls back when stored version is invalid', () => {
    window.localStorage.setItem(
      REPORT_DATA_STORAGE_KEY,
      JSON.stringify({ version: 999, fields: [] }),
    )

    const loaded = loadReportData(sourceColumns)
    expect(loaded.version).toBe(1)
    expect(loaded.fields.length).toBe(7)
  })
})
