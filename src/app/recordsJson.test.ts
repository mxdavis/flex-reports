import { describe, expect, it } from 'vitest'
import { findJsonError, MAX_RECORDS_BYTES, parseRecordsJson, RecordsLoadError } from './recordsJson'

describe('parseRecordsJson', () => {
  it('returns a list of records', () => {
    expect(parseRecordsJson('[{"name":"Ann","client":{"id":1}}, {"name":"Bo"}]')).toEqual([
      { name: 'Ann', client: { id: 1 } },
      { name: 'Bo' },
    ])
  })

  it('accepts an empty list', () => {
    expect(parseRecordsJson(' [] ')).toEqual([])
  })

  it.each([
    ['', 'There\'s no data here.'],
    ['   \n', 'There\'s no data here.'],
    ['[{"name":"Ann"},{"name":"B', 'may be cut off'],
    ['[{"name":"Ann"},', 'may be cut off'],
    ['[{"name":"Ann"}', 'may be cut off'],
    ['[\n  {"name": "Ann"},\n  {"name": Bo}\n]', 'This isn\'t valid JSON. Check line 3, character 12.'],
    ['{"name":"Ann"}', 'This is a single record.'],
    ['{"clients":[],"invoices":[]}', 'This data holds lists inside it (clients, invoices).'],
    ['"hello"', 'Provide a list of records'],
    ['[{"name":"Ann"}, 3]', 'Entry 2 in the list isn\'t a record.'],
    ['[{"name":"Ann"}, [1]]', 'Entry 2 in the list isn\'t a record.'],
    ['[null]', 'Entry 1 in the list isn\'t a record.'],
    ['[{"name":"Ann"}] x', 'This isn\'t valid JSON. Check line 1, character 18.'],
    ['[{"name":"Ann",}]', 'This isn\'t valid JSON. Check line 1, character 16.'],
  ])('explains %j in plain words', (text, message) => {
    expect(() => parseRecordsJson(text)).toThrow(RecordsLoadError)
    expect(() => parseRecordsJson(text)).toThrow(message)
  })

  it('rejects data over 5 MB, counting bytes rather than characters', () => {
    // Each "é" is 2 bytes, so this is over the limit with half as many characters.
    const text = `[{"note":"${'é'.repeat(MAX_RECORDS_BYTES / 2)}"}]`
    expect(() => parseRecordsJson(text)).toThrow('larger than 5 MB')
  })
})

describe('findJsonError', () => {
  it.each([
    ['[1, 2]', undefined],
    ['[1 2]', { offset: 3, cutOff: false }],
    ['{a: 1}', { offset: 1, cutOff: false }],
    ['[1, 2] // note', { offset: 7, cutOff: false }],
    ['[1, 2', { offset: 5, cutOff: true }],
    ['["abc', { offset: 1, cutOff: true }],
  ])('finds where %j breaks', (text, error) => {
    expect(findJsonError(text)).toEqual(error)
  })
})
