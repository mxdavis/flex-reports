import { describe, expect, it } from 'vitest'
import type { ReportRow } from '../../../../services/adapters'
import type { ReportField } from '../../../../services/reportDefinition/types'
import { rawValue, simpleFieldTotal } from '../../../../test/simpleFieldTotal'
import { buildPivotRenderRows, compareRawValues, getGroupKey, getGroupLevelCount } from './sampleRowsPivot'

function field(sourceKey: string, displayType: ReportField['displayType'], aggregation: ReportField['aggregation'] = 'none'): ReportField {
  return { id: sourceKey, label: sourceKey, sourceKey, displayType, aggregation, currencySymbol: '$' }
}

function build(rows: ReportRow[], fields: ReportField[], options: { showTotals?: boolean, collapsed?: string[] } = {}) {
  return buildPivotRenderRows({
    previewRows: rows,
    fields,
    showTotals: options.showTotals ?? false,
    getMappedValue: (row, sourceKey) => String(row[sourceKey]),
    getRawValue: rawValue,
    formatFieldTotal: simpleFieldTotal,
    isGroupExpanded: (_level, groupKey) => !(options.collapsed ?? []).includes(groupKey),
  })
}

describe('compareRawValues', () => {
  it('orders numbers numerically, strings naturally, and blanks last', () => {
    const values: unknown[] = [1000, '', 240, null, 2]
    expect([...values].sort(compareRawValues)).toEqual([2, 240, 1000, '', null])
    expect(['item10', 'item2', 'Item1'].sort(compareRawValues)).toEqual(['Item1', 'item2', 'item10'])
    expect(['2027-01-05', '2026-12-31'].sort(compareRawValues)).toEqual(['2026-12-31', '2027-01-05'])
  })
})

describe('getGroupLevelCount', () => {
  it('groups the leading columns up to the first number column', () => {
    expect(getGroupLevelCount([field('a', 'string'), field('b', 'date'), field('c', 'number'), field('d', 'string')])).toBe(2)
    expect(getGroupLevelCount([field('a', 'currency'), field('b', 'string')])).toBe(0)
  })

  it('groups every column but the last when there are no number columns', () => {
    expect(getGroupLevelCount([field('a', 'string'), field('b', 'string'), field('c', 'date')])).toBe(2)
    expect(getGroupLevelCount([field('a', 'string')])).toBe(0)
  })
})

describe('buildPivotRenderRows', () => {
  it('shows number columns as per-row values, never as groups', () => {
    const rows: ReportRow[] = [
      { id: 'a', team: 'Red', hours: 2, rate: 10 },
      { id: 'b', team: 'Red', hours: 2, rate: 10 },
    ]
    const pivotRows = build(rows, [field('team', 'string'), field('hours', 'number', 'sum'), field('rate', 'number', 'avg')], { showTotals: true })

    expect(pivotRows.map((row) => row.kind)).toEqual(['detail', 'detail', 'subtotal'])
    expect(pivotRows[1].cells.map((cell) => cell.value)).toEqual(['2', '10'])
    expect(pivotRows[2].cells.map((cell) => cell.value)).toEqual(['Red Total', '4', '10'])
  })

  it('groups by underlying values instead of formatted text', () => {
    // A text column holding numbers: grouped, but sorted by the raw number.
    const rows: ReportRow[] = [
      { id: 'a', price: 1000, region: 'North' },
      { id: 'b', price: 240, region: 'South' },
    ]

    const pivotRows = buildPivotRenderRows({
      previewRows: rows,
      fields: [field('price', 'string'), field('region', 'string')],
      showTotals: false,
      getMappedValue: (row, sourceKey) => (sourceKey === 'price' ? `$${Number(row.price).toLocaleString('en-US')}.00` : String(row[sourceKey])),
      getRawValue: rawValue,
      formatFieldTotal: () => '',
      isGroupExpanded: () => true,
    })

    const groupLabels = pivotRows.map((row) => row.cells.find((cell) => cell.columnIndex === 0)?.value)
    expect(groupLabels).toEqual(['$240.00', '$1,000.00'])
  })

  it('emits a total row for every group, even a single-row one', () => {
    const rows: ReportRow[] = [
      { id: 'a', team: 'Red', member: 'Ann', score: 1 },
      { id: 'b', team: 'Red', member: 'Ann', score: 2 },
      { id: 'c', team: 'Red', member: 'Bo', score: 3 },
    ]
    const pivotRows = build(rows, [field('team', 'string'), field('member', 'string'), field('score', 'number', 'sum')], { showTotals: true })

    const subtotals = pivotRows.filter((row) => row.kind === 'subtotal').map((row) => row.cells[0].value)
    expect(subtotals).toEqual(['Ann Total', 'Bo Total', 'Red Total'])
  })

  it('collapses a group to a single row and shrinks its parent span', () => {
    const rows: ReportRow[] = [
      { id: 'a', team: 'Red', member: 'Ann', score: 1 },
      { id: 'b', team: 'Red', member: 'Ann', score: 2 },
      { id: 'c', team: 'Red', member: 'Bo', score: 3 },
    ]
    const pivotRows = build(
      rows,
      [field('team', 'string'), field('member', 'string'), field('score', 'number', 'sum')],
      { collapsed: [getGroupKey(['Red', 'Ann'])] },
    )

    expect(pivotRows.map((row) => row.kind)).toEqual(['collapsed', 'detail'])
    const teamCell = pivotRows[0].cells[0]
    expect(teamCell).toMatchObject({ value: 'Red', rowSpan: 2, toggle: { isExpanded: true } })
    expect(pivotRows[0].cells[1]).toMatchObject({ value: 'Ann', toggle: { isExpanded: false } })
    expect(pivotRows[0].cells[2]).toMatchObject({ value: '3', emphasis: true })
  })
})
