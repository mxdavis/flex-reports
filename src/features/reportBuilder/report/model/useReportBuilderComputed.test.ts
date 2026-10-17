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
    aggregation: 'count',
    currencySymbol: '',
  },
  {
    id: 'field-clientName',
    label: 'Client',
    sourceKey: 'clientName',
    displayType: 'string',
    aggregation: 'count',
    currencySymbol: '',
  },
  {
    id: 'field-originating',
    label: 'Originating Person',
    sourceKey: 'originatingPersonId',
    displayType: 'string',
    aggregation: 'count',
    currencySymbol: '',
  },
  {
    id: 'field-rate',
    label: 'Rate',
    sourceKey: 'rate',
    displayType: 'currency',
    aggregation: 'sum',
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
})
