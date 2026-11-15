import { describe, expect, it } from 'vitest'
import { createRecordsDataSource, getRowKey } from './recordsDataSource'
import { generateDefaultReportData } from '../reportDefinition/storage'

describe('record input', () => {
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
    expect(generateDefaultReportData(source.getSchema()).fields).toHaveLength(15)
    expect(generateDefaultReportData(source.getSchema()).fields.every((field) => field.displayType === 'string')).toBe(true)
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
    expect(() => createRecordsDataSource([{ date: new Date() }])).toThrow('class instances')
    expect(() => createRecordsDataSource([{ callback: () => 1 }])).toThrow('JSON-compatible')
  })

  it('accepts exact bounds and rejects excess rows, fields, depth, and UTF-8 bytes', () => {
    expect(createRecordsDataSource(Array.from({ length: 1000 }, () => ({}))).getReportRows()).toHaveLength(1000)
    expect(() => createRecordsDataSource(Array.from({ length: 1001 }, () => ({})))).toThrow('1,000')
    const fields = Object.fromEntries(Array.from({ length: 50 }, (_, i) => [`key${i}`, i]))
    expect(createRecordsDataSource([fields]).getSchema()).toHaveLength(50)
    expect(() => createRecordsDataSource([{ ...fields, extra: 1 }])).toThrow('50 fields')
    let nested: Record<string, unknown> = { value: 1 }
    for (let i = 1; i < 10; i++) nested = { child: nested }
    expect(() => createRecordsDataSource([nested])).not.toThrow()
    expect(() => createRecordsDataSource([{ child: nested }])).toThrow('10 nesting')
    const overhead = new TextEncoder().encode(JSON.stringify([{ text: '' }])).length
    const text = 'a'.repeat(5 * 1024 * 1024 - overhead)
    expect(() => createRecordsDataSource([{ text }])).not.toThrow()
    expect(() => createRecordsDataSource([{ text: `${text}é` }])).toThrow('5 MiB')
  })
})
