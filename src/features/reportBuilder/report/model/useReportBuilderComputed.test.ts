import { renderHook } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import type { ReportRow } from '../../../../services/adapters'
import type { ReportField, SourceColumn } from '../../../../services/reportDefinition/types'
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
})
