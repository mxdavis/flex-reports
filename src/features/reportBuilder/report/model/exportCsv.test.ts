import { describe, expect, it } from 'vitest'
import type { ReportRow } from '../../../../services/adapters'
import type { ReportField } from '../../../../services/reportDefinition/types'
import { plainFieldValue } from '../../../../test/simpleFieldTotal'
import { buildCsv } from './exportCsv'

const fields: ReportField[] = [
  { id: 'name', label: 'Name', sourceKey: 'name', displayType: 'string', aggregation: 'none' },
  { id: 'amount', label: 'Amount, USD', sourceKey: 'amount', displayType: 'currency', aggregation: 'sum' },
]

function lines(rows: ReportRow[]): string[] {
  const csv = buildCsv(rows, fields, plainFieldValue)
  expect(csv.startsWith('﻿')).toBe(true)
  return csv.slice(1).split('\r\n').filter(Boolean)
}

describe('buildCsv', () => {
  it('writes a header row and one row per data row, as shown', () => {
    expect(lines([{ id: '1', name: 'Ann', amount: '$5.00' }, { id: '2', name: 'Bo', amount: '-$3.00' }])).toEqual([
      'Name,"Amount, USD"',
      'Ann,$5.00',
      // A builder-formatted negative number keeps its sign.
      'Bo,-$3.00',
    ])
  })

  it('quotes commas, quotes, and line breaks', () => {
    expect(lines([{ id: '1', name: 'Smith, "Jo"\nJr', amount: '1' }])[1]).toBe('"Smith, ""Jo""\nJr",1')
  })

  it('neutralizes text that a spreadsheet would run as a formula', () => {
    const rows = [{ id: '1', name: '=HYPERLINK("x")', amount: '1' }, { id: '2', name: '@SUM(A1)', amount: '1' }, { id: '3', name: '-2+3', amount: '1' }]

    expect(lines(rows).slice(1)).toEqual(['"\'=HYPERLINK(""x"")",1', "'@SUM(A1),1", "'-2+3,1"])
  })
})
