import { afterEach, describe, expect, it, vi } from 'vitest'
import { generateDefaultReportDefinition, isFromNewerVersion, normalizeReportDefinition } from './normalize'
import type { SourceColumn } from './types'

// Deliberately non-billing so defaults are proven schema-driven.
const sourceColumns: SourceColumn[] = [
  { id: 'sku', key: 'sku', label: 'SKU', dataType: 'string' },
  { id: 'shippedOn', key: 'shippedOn', label: 'Shipped On', dataType: 'date' },
  { id: 'quantity', key: 'quantity', label: 'Quantity', dataType: 'number' },
  { id: 'price', key: 'price', label: 'Price', dataType: 'currency' },
]

describe('generateDefaultReportDefinition', () => {
  it('builds one field per schema column with type-based defaults', () => {
    const definition = generateDefaultReportDefinition(sourceColumns)

    expect(definition.version).toBe(1)
    expect(definition.fields.map((field) => field.sourceKey)).toEqual(['sku', 'shippedOn', 'quantity', 'price'])
    expect(definition.fields.map((field) => field.displayType)).toEqual(['string', 'date', 'decimal', 'currency'])
    expect(definition.fields.map((field) => field.aggregation)).toEqual(['distinct', 'distinct', 'sum', 'sum'])
    expect(definition.formulas).toEqual([])
    expect(definition.view).toEqual({ orientation: 'horizontal', showTotals: false, isGroupingEnabled: false, expandedLevels: null })
  })
})

describe('normalizeReportDefinition', () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('keeps a valid definition as-is', () => {
    const valid = {
      ...generateDefaultReportDefinition(sourceColumns, [{ label: 'lineTotal', expression: '{{quantity}} * {{price}}' }]),
      sheetName: 'Shipments',
      view: { orientation: 'vertical', showTotals: true, isGroupingEnabled: true, expandedLevels: 1 },
    }

    expect(normalizeReportDefinition(valid, sourceColumns)).toEqual(valid)
  })

  it('returns defaults and logs for an unsupported version', () => {
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => undefined)

    const normalized = normalizeReportDefinition({ version: 'two', fields: [] }, sourceColumns)

    expect(normalized).toEqual(generateDefaultReportDefinition(sourceColumns))
    expect(errorSpy).toHaveBeenCalledWith(expect.stringContaining('Unsupported reportDefinition version'))
  })

  it('drops invalid fields, repairs bad enums, and logs', () => {
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => undefined)

    const normalized = normalizeReportDefinition({
      version: 1,
      fields: [
        { id: 'a', sourceKey: 'price', label: '', displayType: 'bogus', aggregation: 'bogus' },
        { id: 'missing-source' },
      ],
      formulas: [{ label: 'x', expression: '1' }, { label: 'X', expression: '2' }, { label: '', expression: '3' }],
      view: { orientation: 'diagonal', showTotals: 'yes', expandedLevels: -1 },
    }, sourceColumns)

    expect(normalized.fields).toEqual([
      { id: 'a', sourceKey: 'price', label: 'price', displayType: 'currency', aggregation: 'sum' },
    ])
    expect(normalized.formulas).toEqual([{ label: 'x', expression: '1' }])
    expect(normalized.view).toEqual({ orientation: 'horizontal', showTotals: false, isGroupingEnabled: false, expandedLevels: null })
    expect(errorSpy).toHaveBeenCalledWith(expect.stringContaining('Dropped 1 invalid field'))
  })

  it('returns defaults silently when nothing is passed', () => {
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => undefined)

    expect(normalizeReportDefinition(undefined, sourceColumns)).toEqual(generateDefaultReportDefinition(sourceColumns))
    expect(errorSpy).not.toHaveBeenCalled()
  })

  it('gives repeated column ids a fresh id, and keeps at most 15 columns', () => {
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => undefined)
    const column = { id: 'dup', sourceKey: 'sku', label: 'SKU', displayType: 'string', aggregation: 'none' }

    const normalized = normalizeReportDefinition({ version: 1, fields: Array.from({ length: 20 }, () => column) }, sourceColumns)

    expect(normalized.fields).toHaveLength(15)
    expect(new Set(normalized.fields.map((field) => field.id)).size).toBe(15)
    expect(normalized.fields[0].id).toBe('dup')
    expect(errorSpy).toHaveBeenCalledWith(expect.stringContaining('more than 15 columns'))
    expect(errorSpy).toHaveBeenCalledWith(expect.stringContaining('repeated id "dup"'))
  })

  it('drops formulas the editor would reject, and keeps at most 25', () => {
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => undefined)
    const valid = Array.from({ length: 30 }, (_, index) => ({ label: `f${index}`, expression: '1' }))

    const normalized = normalizeReportDefinition({
      version: 1,
      fields: [],
      formulas: [
        { label: '9bad', expression: '1' },
        { label: 'Price', expression: '{{quantity}} * 2' },
        { label: 'long', expression: '1+'.repeat(400) },
        ...valid,
      ],
    }, sourceColumns)

    expect(normalized.formulas).toHaveLength(25)
    expect(normalized.formulas.map((formula) => formula.label)).not.toContain('Price')
    expect(errorSpy).toHaveBeenCalledWith(expect.stringContaining('Dropped formula "9bad"'))
    expect(errorSpy).toHaveBeenCalledWith(expect.stringContaining('"Price" is already a data field'))
    expect(errorSpy).toHaveBeenCalledWith(expect.stringContaining('Dropped formula "long"'))
    expect(errorSpy).toHaveBeenCalledWith(expect.stringContaining('more than 25 formulas'))
  })

  it('reads a definition from a newer version best effort, with a warning', () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => undefined)
    const newer = { ...generateDefaultReportDefinition(sourceColumns), version: 2, sheetName: 'From v2', somethingNew: true }

    const normalized = normalizeReportDefinition(newer, sourceColumns)

    expect(normalized.sheetName).toBe('From v2')
    expect(normalized.fields).toEqual(newer.fields)
    expect(warnSpy).toHaveBeenCalledWith(expect.stringContaining('newer than this version'))
  })
})

describe('isFromNewerVersion', () => {
  it('is true only for a whole version number above the current one', () => {
    expect(isFromNewerVersion({ version: 2 })).toBe(true)
    expect(isFromNewerVersion({ version: 1 })).toBe(false)
    expect(isFromNewerVersion({ version: '2' })).toBe(false)
    expect(isFromNewerVersion({ version: 1.5 })).toBe(false)
    expect(isFromNewerVersion(undefined)).toBe(false)
  })
})
