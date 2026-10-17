import { afterEach, describe, expect, it, vi } from 'vitest'
import { generateDefaultReportDefinition, normalizeReportDefinition } from './normalize'
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
    expect(definition.fields[3].currencySymbol).toBe('$')
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

    const normalized = normalizeReportDefinition({ version: 99, fields: [] }, sourceColumns)

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
      { id: 'a', sourceKey: 'price', label: 'price', displayType: 'currency', aggregation: 'sum', currencySymbol: '$' },
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
})
