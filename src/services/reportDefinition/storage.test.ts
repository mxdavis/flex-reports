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
  { id: 'column1', key: 'workDate', defaultLabel: 'column1' },
  { id: 'column2', key: 'personName', defaultLabel: 'column2' },
  { id: 'column3', key: 'clientName', defaultLabel: 'column3' },
  { id: 'column4', key: 'task', defaultLabel: 'column4' },
  { id: 'column5', key: 'hours', defaultLabel: 'column5' },
  { id: 'column6', key: 'rate', defaultLabel: 'column6' },
  { id: 'column7', key: 'total', defaultLabel: 'column7' },
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
    expect(defaults.fields[0]?.label).toBe('workDate')
    expect(defaults.fields[0]?.displayType).toBe('string')
    expect(defaults.fields[5]?.displayType).toBe('string')
  })

  it('persists and reloads reportData', () => {
    const defaults = generateDefaultReportData(sourceColumns)
    const updated: ReportData = {
      ...defaults,
      fields: defaults.fields.map((field) => {
        if (field.id !== 'people') {
          return field
        }

        return {
          ...field,
          sourceKey: 'clientName' as const,
          displayType: 'string',
        }
      }),
    }

    saveReportData(updated)
    const loaded = loadReportData(sourceColumns)

    expect(loaded.fields.find((field) => field.id === 'people')?.sourceKey).toBe('clientName')
    expect(loaded.fields.find((field) => field.id === 'people')?.label).toBe('personName')
    expect(loaded.fields.find((field) => field.id === 'people')?.displayType).toBe('string')
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

  it('migrates v3 data by applying string default display types', () => {
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
    expect(loaded.fields.find((field) => field.id === 'date')?.displayType).toBe('string')
    expect(loaded.fields.find((field) => field.id === 'rate')?.displayType).toBe('string')
    expect(window.localStorage.getItem(REPORT_DATA_STORAGE_KEY)).toBeTruthy()
    expect(window.localStorage.getItem(LEGACY_REPORT_DATA_STORAGE_KEY)).toBeNull()
  })
})
