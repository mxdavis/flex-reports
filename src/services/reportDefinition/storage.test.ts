import { beforeEach, describe, expect, it } from 'vitest'
import {
  generateDefaultReportData,
  LEGACY_REPORT_DATA_STORAGE_KEY,
  loadReportData,
  REPORT_DATA_STORAGE_KEY,
  saveReportData,
} from './storage'
import type { ReportData, SourceColumn } from './types'

const sourceColumns: SourceColumn[] = [
  { id: 'column1', key: 'workDate', label: 'Work Date', dataType: 'date' },
  { id: 'column2', key: 'personName', label: 'Person', dataType: 'string' },
  { id: 'column3', key: 'clientName', label: 'Client', dataType: 'string' },
  { id: 'column4', key: 'task', label: 'Task', dataType: 'string' },
  { id: 'column5', key: 'hours', label: 'Hours', dataType: 'number' },
  { id: 'column6', key: 'rate', label: 'Rate', dataType: 'currency' },
  { id: 'column7', key: 'total', label: 'Total', dataType: 'currency' },
]

function createMemoryStorage(): Storage {
  const store = new Map<string, string>()

  return {
    get length() {
      return store.size
    },
    clear() {
      store.clear()
    },
    getItem(key: string) {
      return store.has(key) ? store.get(key)! : null
    },
    key(index: number) {
      return Array.from(store.keys())[index] ?? null
    },
    removeItem(key: string) {
      store.delete(key)
    },
    setItem(key: string, value: string) {
      store.set(key, value)
    },
  }
}

describe('reportDefinition storage', () => {
  beforeEach(() => {
    Object.defineProperty(window, 'localStorage', {
      value: createMemoryStorage(),
      configurable: true,
    })

    window.localStorage.clear()
  })

  it('creates a default reportData shape', () => {
    const defaults = generateDefaultReportData(sourceColumns)

    expect(defaults.version).toBe(4)
    expect(defaults.fields.length).toBe(7)
    expect(defaults.fields[0]?.sourceKey).toBe('workDate')
    expect(defaults.fields[0]?.label).toBe('Work Date')
    expect(defaults.fields[0]?.displayType).toBe('date')
    expect(defaults.fields[0]?.chipAggregation).toBe('count')
    expect(defaults.fields[5]?.displayType).toBe('currency')
    expect(defaults.fields[5]?.chipAggregation).toBe('sum')
  })

  it('persists and reloads reportData', () => {
    const defaults = generateDefaultReportData(sourceColumns)
    const updated: ReportData = {
      ...defaults,
      fields: defaults.fields.map((field) => {
        if (field.id !== 'column2') {
          return field
        }

        return {
          ...field,
          sourceKey: 'clientName' as const,
          displayType: 'string',
          chipAggregation: 'count',
        }
      }),
    }

    saveReportData(updated)
    const loaded = loadReportData(sourceColumns)

    expect(loaded.fields.find((field) => field.id === 'column2')?.sourceKey).toBe('clientName')
    expect(loaded.fields.find((field) => field.id === 'column2')?.label).toBe('Person')
    expect(loaded.fields.find((field) => field.id === 'column2')?.displayType).toBe('string')
    expect(loaded.fields.find((field) => field.id === 'column2')?.chipAggregation).toBe('count')
  })

  it('falls back when stored version is invalid', () => {
    window.localStorage.setItem(
      REPORT_DATA_STORAGE_KEY,
      JSON.stringify({ version: 999, fields: [] }),
    )

    const loaded = loadReportData(sourceColumns)
    expect(loaded.version).toBe(4)
    expect(loaded.fields.length).toBe(7)
  })

  it('migrates v3 data by applying current default display types', () => {
    window.localStorage.setItem(
      LEGACY_REPORT_DATA_STORAGE_KEY,
      JSON.stringify({
        version: 3,
        fields: [
          { id: 'date', label: 'workDate', sourceKey: 'workDate' },
          { id: 'rate', label: 'rate', sourceKey: 'rate' },
        ],
      }),
    )

    const loaded = loadReportData(sourceColumns)

    expect(loaded.version).toBe(4)
    expect(loaded.fields.find((field) => field.id === 'date')?.displayType).toBe('date')
    expect(loaded.fields.find((field) => field.id === 'rate')?.displayType).toBe('currency')
    expect(loaded.fields.find((field) => field.id === 'date')?.chipAggregation).toBe('count')
    expect(loaded.fields.find((field) => field.id === 'rate')?.chipAggregation).toBe('sum')
    expect(window.localStorage.getItem(REPORT_DATA_STORAGE_KEY)).toBeTruthy()
    expect(window.localStorage.getItem(LEGACY_REPORT_DATA_STORAGE_KEY)).toBeNull()
  })
})
