import { renderHook } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import type { ReportRow } from '../../../../services/adapters'
import type { ReportField, SourceColumn } from '../../../../services/reportDefinition/types'
import { createRecordsDataSource } from '../../../../services/adapters/recordsDataSource'
import { useReportBuilderComputed } from './useReportBuilderComputed'

const sourceColumns: SourceColumn[] = [
  { id: 'workDate', key: 'workDate', label: 'Work Date', dataType: 'date' },
  { id: 'personName', key: 'personName', label: 'Person', dataType: 'string' },
  { id: 'clientName', key: 'clientName', label: 'Client', dataType: 'string' },
  { id: 'originatingPersonId', key: 'originatingPersonId', label: 'Originating Person', dataType: 'string' },
  { id: 'rate', key: 'rate', label: 'Rate', dataType: 'currency' },
]

const reportFields: ReportField[] = [
  {
    id: 'field-workDate',
    label: 'Work Date',
    sourceKey: 'workDate',
    displayType: 'date',
    aggregation: 'count',
  },
  {
    id: 'field-clientName',
    label: 'Client',
    sourceKey: 'clientName',
    displayType: 'string',
    aggregation: 'count',
  },
  {
    id: 'field-originating',
    label: 'Originating Person',
    sourceKey: 'originatingPersonId',
    displayType: 'string',
    aggregation: 'count',
  },
  {
    id: 'field-rate',
    label: 'Rate',
    sourceKey: 'rate',
    displayType: 'currency',
    aggregation: 'sum',
  },
]

const repeatedValueRows: ReportRow[] = [
  {
    id: 'row-1',
    workDate: '2026-07-01',
    personId: 'p1',
    personName: 'Alex Rivera',
    clientId: 'c1',
    clientName: 'Northwind Manufacturing',
    originatingPersonId: 'p1',
    task: 'Drafting',
    hours: 2,
    rate: 240,
    total: 480,
  },
  {
    id: 'row-2',
    workDate: '2026-07-01',
    personId: 'p2',
    personName: 'Sam Patel',
    clientId: 'c1',
    clientName: 'Northwind Manufacturing',
    originatingPersonId: 'p1',
    task: 'Review',
    hours: 3,
    rate: 240,
    total: 720,
  },
]

function fieldWith(sourceKey: string, aggregation: ReportField['aggregation']): ReportField {
  const base = reportFields.find((field) => field.sourceKey === sourceKey)!
  return { ...base, aggregation }
}

describe('useReportBuilderComputed', () => {
  function renderComputed() {
    return renderHook(() =>
      useReportBuilderComputed({
        rows: repeatedValueRows,
        sourceColumns,
        reportFields,
        formulas: [],
        currencySymbol: '$',
        tableOrientation: 'horizontal',
        showTips: true,
      }),
    ).result
  }

  it('count returns row count and distinct returns unique value count per column', () => {
    const result = renderComputed()
    const total = result.current.formatFieldTotal

    // Count is raw row count regardless of column.
    expect(total(repeatedValueRows, fieldWith('originatingPersonId', 'count'))).toBe('2')
    expect(total(repeatedValueRows, fieldWith('rate', 'count'))).toBe('2')

    // Distinct count is per-column unique values.
    expect(total(repeatedValueRows, fieldWith('originatingPersonId', 'distinct'))).toBe('1')
    expect(total(repeatedValueRows, fieldWith('rate', 'distinct'))).toBe('1')
    expect(total(repeatedValueRows, fieldWith('clientName', 'distinct'))).toBe('1')
  })

  it('sums and averages in the column format, and leaves none blank', () => {
    const result = renderComputed()
    const total = result.current.formatFieldTotal

    expect(total(repeatedValueRows, fieldWith('rate', 'sum'))).toBe('$480.00')
    expect(total(repeatedValueRows, fieldWith('rate', 'avg'))).toBe('$240.00')
    expect(total(repeatedValueRows, fieldWith('rate', 'none'))).toBe('')
  })

  it('builds summary chips from each column aggregation, skipping none', () => {
    const result = renderComputed()

    expect(result.current.summaryItems).toEqual([
      { label: 'Work Date (count)', value: '2' },
      { label: 'Client (count)', value: '2' },
      { label: 'Originating Person (count)', value: '2' },
      { label: 'Rate (sum)', value: '$480.00' },
    ])
  })

  it('refreshes cached cell values when the currency symbol or a formula changes', () => {
    const rate = fieldWith('rate', 'sum')
    const { result, rerender } = renderHook(
      ({ currencySymbol, formulas }) => useReportBuilderComputed({
        rows: repeatedValueRows,
        sourceColumns,
        reportFields,
        formulas,
        currencySymbol,
        tableOrientation: 'horizontal',
        showTips: true,
      }),
      { initialProps: { currencySymbol: '$', formulas: [{ label: 'doubleRate', expression: '{{rate}} * 2' }] } },
    )
    const row = repeatedValueRows[0]

    expect(result.current.getFieldValue(row, rate)).toBe('$240.00')
    expect(result.current.getMappedRawValue(row, '%doubleRate')).toBe(480)

    rerender({ currencySymbol: '€', formulas: [{ label: 'doubleRate', expression: '{{rate}} * 3' }] })

    expect(result.current.getFieldValue(row, rate)).toBe('€240.00')
    expect(result.current.getMappedRawValue(row, '%doubleRate')).toBe(720)
    expect(result.current.formatFieldTotal(repeatedValueRows, rate)).toBe('€480.00')
  })
  it('uses one numeric interpretation for formulas, sums and averages', () => {
    const rows = [
      { amount: '250', decimalAmount: '12.5' }, { amount: '50', decimalAmount: '0.75' },
      { amount: 'bad', decimalAmount: 'invalid' }, { amount: '250abc', decimalAmount: '2.75' },
    ]
    const { result } = renderHook(() => useReportBuilderComputed({
      rows, sourceColumns: createRecordsDataSource(rows).getSchema(), reportFields: [],
      formulas: [{ label: 'twice', expression: '{{amount}} * 2' }],
      currencySymbol: '$', tableOrientation: 'horizontal', showTips: true,
    }))
    expect(result.current.getFieldTotal(rows, { id: 'test', label: 'Test', sourceKey: 'amount', displayType: 'decimal', aggregation: 'sum' })).toBe(300)
    expect(result.current.getFieldTotal(rows, { id: 'test', label: 'Test', sourceKey: 'amount', displayType: 'decimal', aggregation: 'avg' })).toBe(150)
    expect(result.current.getFieldTotal(rows, { id: 'test', label: 'Test', sourceKey: 'decimalAmount', displayType: 'decimal', aggregation: 'sum' })).toBe(16)
    expect(result.current.getFieldTotal(rows, { id: 'test', label: 'Test', sourceKey: 'decimalAmount', displayType: 'decimal', aggregation: 'avg' })).toBeCloseTo(16 / 3)
    expect(result.current.getFieldTotal(rows, { id: 'test', label: 'Test', sourceKey: '%twice', displayType: 'decimal', aggregation: 'sum' })).toBe(600)
    expect(result.current.getFieldTotal(rows, { id: 'test', label: 'Test', sourceKey: '%twice', displayType: 'decimal', aggregation: 'avg' })).toBe(150)
  })

  it('keeps blanks blank, shows non-numbers as entered and leaves both out of averages', () => {
    const rows = [{ amount: '1,200.00' }, { amount: null }, { amount: 'N/A' }, { amount: '1,250' }, { amount: '' }]
    const amount: ReportField = { id: 'amount', label: 'Amount', sourceKey: 'amount', displayType: 'currency', aggregation: 'avg' }
    const { result } = renderHook(() => useReportBuilderComputed({
      rows, sourceColumns: createRecordsDataSource(rows).getSchema(), reportFields: [amount],
      formulas: [], currencySymbol: '$', tableOrientation: 'horizontal', showTips: true,
    }))
    expect(rows.map((row) => result.current.getFieldValue(row, amount))).toEqual(['$1,200.00', '', 'N/A', '$1,250.00', ''])
    expect(result.current.getFieldTotal(rows, amount)).toBe(1225)
    expect(result.current.getFieldTotal(rows, { ...amount, aggregation: 'sum' })).toBe(2450)
    expect(result.current.issues).toEqual([
      'Column Amount: 1 value isn\'t a number (row 3: "N/A"). It\'s shown as entered, left out of totals, and counted as 0 in formulas.',
    ])
  })

  it('does not flag blank dates as invalid', () => {
    const rows = [{ day: '2026-07-01' }, { day: '' }, { day: null }, { day: '  ' }]
    const day: ReportField = { id: 'day', label: 'Day', sourceKey: 'day', displayType: 'date', aggregation: 'distinct' }
    const render = (testRows: ReportRow[]) => renderHook(() => useReportBuilderComputed({
      rows: testRows, sourceColumns: createRecordsDataSource(testRows).getSchema(), reportFields: [day],
      formulas: [], currencySymbol: '$', tableOrientation: 'horizontal', showTips: true,
    })).result.current
    expect(render(rows).issues).toEqual([])
    expect(render([...rows, { day: 'soon' }]).issues).toEqual(['Column Day: use valid dates. Original values are shown.'])
  })

  it('resolves only actual formula dependencies and preserves reference/calculation errors', () => {
    const rows = [{ amount: '2' }, {}]
    const { result } = renderHook(() => useReportBuilderComputed({
      rows, sourceColumns: createRecordsDataSource(rows).getSchema(), reportFields: [],
      formulas: [
        { label: 'base', expression: '{{amount}} * 2' },
        { label: 'dependent', expression: '{{%BASE}} + 1' },
        { label: 'unknown', expression: '{{misspelled}} + 1' },
        { label: 'circular', expression: '{{%circular}} + 1' },
        { label: 'division', expression: '1 / 0' },
      ], currencySymbol: '$', tableOrientation: 'horizontal', showTips: true,
    }))
    expect(result.current.getFieldTotal(rows, { id: 'test', label: 'Test', sourceKey: '%base', displayType: 'decimal', aggregation: 'sum' })).toBe(4)
    expect(result.current.getFieldTotal(rows, { id: 'test', label: 'Test', sourceKey: '%dependent', displayType: 'decimal', aggregation: 'sum' })).toBe(6)
    for (const field of ['unknown', 'circular', 'division']) {
      expect(result.current.getFieldValue(rows[0], { id: field, label: field, sourceKey: `%${field}`, displayType: 'number', aggregation: 'sum' })).toBe('Invalid formula')
      expect(result.current.getFieldTotal(rows, { id: 'test', label: 'Test', sourceKey: `%${field}`, displayType: 'decimal', aggregation: 'sum' })).toBeNaN()
    }
    expect(result.current.issues).toHaveLength(3)
  })

})

it('calculates formulas and totals over more than 1,000 source rows', () => {
  const rows = Array.from({ length: 1500 }, () => ({ amount: '2' }))
  const { result } = renderHook(() => useReportBuilderComputed({
    rows, sourceColumns: createRecordsDataSource(rows).getSchema(), reportFields: [],
    formulas: [{ label: 'twice', expression: '{{amount}} * 2' }],
    currencySymbol: '$', tableOrientation: 'horizontal', showTips: true,
  }))
  const field: ReportField = { id: 'twice', label: 'Twice', sourceKey: '%twice', displayType: 'number', aggregation: 'sum' }
  expect(result.current.getFieldTotal(rows, field)).toBe(6000)
  expect(result.current.getFieldRawValue(rows[1499], field)).toBe(4)
  expect(result.current.getFieldRawValue(rows[0], { ...field, sourceKey: 'amount' })).toBe(2)
  expect(result.current.getFieldRawValue(rows[0], { ...field, sourceKey: 'amount', displayType: 'string' })).toBe('2')
})
