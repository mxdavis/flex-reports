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
    chipAggregation: 'count',
    currencySymbol: '',
  },
  {
    id: 'field-clientName',
    label: 'Client',
    sourceKey: 'clientName',
    displayType: 'string',
    chipAggregation: 'count',
    currencySymbol: '',
  },
  {
    id: 'field-originating',
    label: 'Originating Person',
    sourceKey: 'originatingPersonId',
    displayType: 'string',
    chipAggregation: 'count',
    currencySymbol: '',
  },
  {
    id: 'field-rate',
    label: 'Rate',
    sourceKey: 'rate',
    displayType: 'currency',
    chipAggregation: 'sum',
    currencySymbol: '$',
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

describe('useReportBuilderComputed', () => {
  it('count returns row count and distinct returns unique value count per column', () => {
    const { result } = renderHook(() =>
      useReportBuilderComputed({
        rows: repeatedValueRows,
        sourceColumns,
        reportFields,
        formulas: [],
        currencySymbol: '$',
        tableOrientation: 'horizontal',
        aggregateMode: 'count',
      }),
    )

    // Count is raw row count regardless of column.
    expect(result.current.getAggregatedFieldValue(repeatedValueRows, 'originatingPersonId', 'count')).toBe(2)
    expect(result.current.getAggregatedFieldValue(repeatedValueRows, 'rate', 'count')).toBe(2)
    expect(result.current.getAggregatedFieldValue(repeatedValueRows, 'personName', 'count')).toBe(2)

    // Distinct count is per-column unique values.
    expect(result.current.getAggregatedFieldValue(repeatedValueRows, 'originatingPersonId', 'distinct')).toBe(1)
    expect(result.current.getAggregatedFieldValue(repeatedValueRows, 'rate', 'distinct')).toBe(1)
    expect(result.current.getAggregatedFieldValue(repeatedValueRows, 'personName', 'distinct')).toBe(2)
  })
  it('uses one numeric interpretation for formulas, sums and averages', () => {
    const rows = [
      { amount: '250', decimalAmount: '12.5' }, { amount: '50', decimalAmount: '0.75' },
      { amount: 'bad', decimalAmount: 'invalid' }, { amount: '250abc', decimalAmount: '2.75' },
    ]
    const { result } = renderHook(() => useReportBuilderComputed({
      rows, sourceColumns: createRecordsDataSource(rows).getSchema(), reportFields: [],
      formulas: [{ label: 'twice', expression: '{{amount}} * 2' }],
      currencySymbol: '$', tableOrientation: 'horizontal', aggregateMode: 'sum',
    }))
    expect(result.current.getAggregatedFieldValue(rows, 'amount', 'sum')).toBe(300)
    expect(result.current.getAggregatedFieldValue(rows, 'amount', 'avg')).toBe(75)
    expect(result.current.getAggregatedFieldValue(rows, 'decimalAmount', 'sum')).toBe(16)
    expect(result.current.getAggregatedFieldValue(rows, 'decimalAmount', 'avg')).toBe(4)
    expect(result.current.getAggregatedFieldValue(rows, 'twice', 'sum')).toBe(600)
    expect(result.current.getAggregatedFieldValue(rows, 'twice', 'avg')).toBe(150)
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
      ], currencySymbol: '$', tableOrientation: 'horizontal', aggregateMode: 'sum',
    }))
    expect(result.current.getAggregatedFieldValue(rows, 'base', 'sum')).toBe(4)
    expect(result.current.getAggregatedFieldValue(rows, 'dependent', 'sum')).toBe(6)
    for (const field of ['unknown', 'circular', 'division']) {
      expect(result.current.getMappedValue(rows[0], field, 'number')).toBe('Invalid formula')
      expect(result.current.getAggregatedFieldValue(rows, field, 'sum')).toBeNaN()
    }
    expect(result.current.issues).toHaveLength(3)
  })

})
