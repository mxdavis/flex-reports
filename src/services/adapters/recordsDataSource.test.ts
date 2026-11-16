import { describe, expect, it } from 'vitest'
import { createRecordsDataSource, getRowKey } from './recordsDataSource'
import { generateDefaultReportDefinition } from '../reportDefinition/normalize'

describe('record input', () => {
  it('discovers nested scalar paths across rows, keeping ids ordinary and dotted keys separate', () => {
    const source = createRecordsDataSource([
      { client: { id: 'c1', name: 'Acme' }, 'client.name': 'Literal', Name: 'A', name: 'B' },
      { client: { name: 'Beta', address: { city: 'Boston' } }, '': 4 },
    ])
    expect(source.getSchema().map(({ key, path, label, dataType }) => ({ key, path, label, dataType }))).toEqual(
      [
        ['client.id', ['client', 'id']], ['client.name', ['client', 'name']],
        ['["client.name"]', ['client.name']], ['Name', ['Name']], ['name', ['name']],
        ['client.address.city', ['client', 'address', 'city']], ['[""]', ['']],
      ].map(([key, path]) => ({ key, path, label: key, dataType: 'string' })),
    )
  })

  it('skips fields with several entries per row, naming them, without flattening or joining', () => {
    const source = createRecordsDataSource([{ clientId: 'c1', entries: [{ client: { name: 'Hidden' } }], hours: 2 }])
    expect(source.getSchema().map((field) => field.key)).toEqual(['clientId', 'hours'])
    expect(source.getSkippedFields()).toEqual(['entries'])
  })

  it('discovers every key in first-seen order without assuming field types', () => {
    const records = Object.freeze([Object.freeze({ hours: '4', id: 'same' }), Object.freeze({ id: 'same', later: 3 })])
    const source = createRecordsDataSource(records)
    expect(source.getSchema().map((field) => [field.key, field.dataType])).toEqual([
      ['hours', 'string'], ['id', 'string'], ['later', 'string'],
    ])
    const rows = source.getReportRows()
    expect(rows).toEqual(records)
    expect(getRowKey(rows[0])).not.toBe(getRowKey(rows[1]))
    expect(rows[0].id).toBe('same')
  })

  it('limits displayed columns without losing available source fields', () => {
    const source = createRecordsDataSource([Object.fromEntries(Array.from({ length: 20 }, (_, i) => [`key${i}`, i]))])
    expect(source.getSchema()).toHaveLength(20)
    expect(generateDefaultReportDefinition(source.getSchema()).fields).toHaveLength(15)
    expect(generateDefaultReportDefinition(source.getSchema()).fields.every((field) => field.displayType === 'string')).toBe(true)
  })

  it('accepts empty input and gives duplicate object occurrences separate render keys', () => {
    expect(createRecordsDataSource([]).getReportRows()).toEqual([])
    const row = { item: 'Cable' }
    const rows = createRecordsDataSource([row, row]).getReportRows()
    expect(getRowKey(rows[0])).not.toBe(getRowKey(rows[1]))
  })

  it('rejects invalid rows, circular data and class instances before rendering', () => {
    expect(() => createRecordsDataSource([null!])).toThrow('Row 1')
    const row: Record<string, unknown> = {}
    row.self = row
    expect(() => createRecordsDataSource([row])).toThrow('circular')
    expect(() => createRecordsDataSource([{ date: new Date() }])).not.toThrow()
    expect(() => createRecordsDataSource([{ value: new Map() }])).toThrow('class instances')
    expect(() => createRecordsDataSource([{ callback: () => 1 }])).toThrow('JSON-compatible')
  })

  it('accepts large datasets without truncating source rows or fields', () => {
    const rows = Array.from({ length: 1500 }, (_, value) => ({ value }))
    expect(createRecordsDataSource(rows).getReportRows()).toHaveLength(1500)
    const fields = Object.fromEntries(Array.from({ length: 60 }, (_, i) => [`key${i}`, i]))
    expect(createRecordsDataSource([fields]).getSchema()).toHaveLength(60)
  })
})
