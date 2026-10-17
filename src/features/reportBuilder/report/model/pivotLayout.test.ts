import { describe, expect, it } from 'vitest'
import type { ReportRow } from '../../../../services/adapters'
import type { ReportField } from '../../../../services/reportDefinition/types'
import { rawValue, simpleFieldTotal } from '../../../../test/simpleFieldTotal'
import { buildTreeRows, compareRawValues, countOutlineRows, getEffectiveExpandedLevels, getGroupKey, getTreeLayout, type TreeRow } from './pivotLayout'

function field(sourceKey: string, displayType: ReportField['displayType'], aggregation: ReportField['aggregation'] = 'none'): ReportField {
  return { id: sourceKey, label: sourceKey, sourceKey, displayType, aggregation }
}

const teamFields = [field('team', 'string'), field('member', 'string'), field('task', 'string'), field('hours', 'number', 'sum')]
const teamRows: ReportRow[] = [
  { id: 'a', team: 'Red', member: 'Ann', task: 'Review', hours: 1 },
  { id: 'b', team: 'Red', member: 'Ann', task: 'Draft', hours: 2 },
  { id: 'c', team: 'Red', member: 'Bo', task: 'Draft', hours: 3 },
  { id: 'd', team: 'Blue', member: 'Cy', task: 'Draft', hours: 4 },
]

function build(options: { showTotals?: boolean, collapsed?: string[], rows?: ReportRow[], fields?: ReportField[] } = {}) {
  return buildTreeRows({
    rows: options.rows ?? teamRows,
    fields: options.fields ?? teamFields,
    showTotals: options.showTotals ?? true,
    getFieldValue: (row, field) => String(row[field.sourceKey]),
    getRawValue: rawValue,
    formatFieldTotal: simpleFieldTotal,
    isGroupExpanded: (_level, groupKey) => !(options.collapsed ?? []).includes(groupKey),
  })
}

function outline(rows: TreeRow[]): string[] {
  return rows.map((row) => `${'  '.repeat(row.level)}${row.kind === 'group' ? (row.isExpanded ? '▾ ' : '▸ ') : ''}${row.label} ${row.values.map((cell) => cell.value).join(' ')}`.trimEnd())
}

describe('compareRawValues', () => {
  it('orders numbers numerically, strings naturally, and blanks last', () => {
    const values: unknown[] = [1000, '', 240, null, 2]
    expect([...values].sort(compareRawValues)).toEqual([2, 240, 1000, '', null])
    expect(['item10', 'item2', 'Item1'].sort(compareRawValues)).toEqual(['Item1', 'item2', 'item10'])
    expect(['2027-01-05', '2026-12-31'].sort(compareRawValues)).toEqual(['2026-12-31', '2027-01-05'])
  })
})

describe('getTreeLayout', () => {
  it('nests the leading text columns, with the last one naming each row', () => {
    expect(getTreeLayout(teamFields)).toEqual({ groupCount: 2, labelIndex: 2 })
    expect(getTreeLayout([field('a', 'string'), field('b', 'number'), field('c', 'string')])).toEqual({ groupCount: 0, labelIndex: 0 })
  })

  it('uses the last column as the row name when there are no number columns', () => {
    expect(getTreeLayout([field('a', 'string'), field('b', 'string'), field('c', 'date')])).toEqual({ groupCount: 2, labelIndex: 2 })
  })

  it('has nothing to group when the first column is a number', () => {
    expect(getTreeLayout([field('a', 'currency'), field('b', 'string')])).toEqual({ groupCount: 0, labelIndex: -1 })
  })
})

describe('buildTreeRows', () => {
  it('builds group rows with their totals, and named detail rows under the deepest group', () => {
    expect(outline(build())).toEqual([
      '▾ Blue 4',
      '  ▾ Cy 4',
      '    Draft 4',
      '▾ Red 6',
      '  ▾ Ann 3',
      '    Draft 2',
      '    Review 1',
      '  ▾ Bo 3',
      '    Draft 3',
    ])
  })

  it('leaves expanded group totals blank when totals are off, but always totals a collapsed group', () => {
    const rows = build({ showTotals: false, collapsed: [getGroupKey(['Red', 'Ann'])] })

    expect(outline(rows)).toEqual(['▾ Blue', '  ▾ Cy', '    Draft 4', '▾ Red', '  ▸ Ann 3', '  ▾ Bo', '    Draft 3'])
  })

  it('hides everything under a collapsed group', () => {
    expect(outline(build({ collapsed: [getGroupKey(['Red'])] }))).toEqual(['▾ Blue 4', '  ▾ Cy 4', '    Draft 4', '▸ Red 6'])
  })

  it('keys nested groups by their full path', () => {
    const rows = build({ rows: [...teamRows, { id: 'e', team: 'Blue', member: 'Ann', task: 'Plan', hours: 5 }] })
    const annGroups = rows.filter((row) => row.kind === 'group' && row.label === 'Ann')

    expect(annGroups.map((row) => row.kind === 'group' && row.groupKey)).toEqual([getGroupKey(['Blue', 'Ann']), getGroupKey(['Red', 'Ann'])])
  })

  it('groups by underlying values instead of formatted text', () => {
    // A text column holding numbers: grouped, but sorted by the raw number.
    const rows = buildTreeRows({
      rows: [{ id: 'a', price: 1000, region: 'North', units: 1 }, { id: 'b', price: 240, region: 'South', units: 2 }],
      fields: [field('price', 'string'), field('region', 'string'), field('units', 'number')],
      showTotals: false,
      getFieldValue: (row, field) => (field.sourceKey === 'price' ? `$${Number(row.price).toLocaleString('en-US')}.00` : String(row[field.sourceKey])),
      getRawValue: rawValue,
      formatFieldTotal: () => '',
      isGroupExpanded: () => true,
    })

    expect(rows.filter((row) => row.kind === 'group').map((row) => row.label)).toEqual(['$240.00', '$1,000.00'])
  })

  it('returns nothing when there is no column to group by', () => {
    expect(build({ fields: [field('task', 'string'), field('hours', 'number', 'sum')] })).toEqual([])
  })
})

describe('countOutlineRows', () => {
  it('counts the rows shown at each outline level and fully expanded', () => {
    const counts = countOutlineRows(teamRows, teamFields, (row, field) => String(row[field.sourceKey]))

    // Teams: Blue, Red. Members: Blue›Cy, Red›Ann, Red›Bo. Plus 4 detail rows.
    expect(counts).toEqual({ byLevel: [2, 5], all: 9 })
  })
})

describe('getEffectiveExpandedLevels', () => {
  const counts = { byLevel: [2, 5], all: 9 }

  it('keeps the requested level when it fits', () => {
    expect(getEffectiveExpandedLevels(null, counts, 9)).toBeNull()
    expect(getEffectiveExpandedLevels(1, counts, 5)).toBe(1)
  })

  it('falls back to the deepest level that fits', () => {
    expect(getEffectiveExpandedLevels(null, counts, 8)).toBe(1)
    expect(getEffectiveExpandedLevels(null, counts, 4)).toBe(0)
  })

  it('opens at the first level when even that is over the limit', () => {
    expect(getEffectiveExpandedLevels(null, counts, 1)).toBe(0)
  })

  it('treats a level past the last group as fully expanded', () => {
    expect(getEffectiveExpandedLevels(7, counts, 100)).toBeNull()
  })
})
