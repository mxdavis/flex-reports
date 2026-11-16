import { describe, expect, it } from 'vitest'
import { formatFieldPath, parseFieldPath, readFieldPath } from './fieldPath'

describe('field paths', () => {
  it.each([
    [['client', 'name'], 'client.name'],
    [['client.name'], '["client.name"]'],
    [[''], '[""]'],
    [['client', 'display name'], '["client","display name"]'],
    [['%discount'], '["%discount"]'],
    [['a}}b', 'quote"\\'], '["a}}b","quote\\\"\\\\"]'],
  ])('round-trips %j without confusing literal keys with nesting', (path, reference) => {
    expect(formatFieldPath(path)).toBe(reference)
    expect(parseFieldPath(reference)).toEqual(path)
  })

  it('reads case-sensitive own properties, including empty and literal dotted keys', () => {
    const row = { Name: 'Upper', name: 'Lower', client: { name: 'Nested' }, 'client.name': 'Flat', '': 3 }
    expect(readFieldPath(row, ['Name'])).toBe('Upper')
    expect(readFieldPath(row, ['name'])).toBe('Lower')
    expect(readFieldPath(row, ['NAME'])).toBeUndefined()
    expect(readFieldPath(row, ['client', 'name'])).toBe('Nested')
    expect(readFieldPath(row, ['client.name'])).toBe('Flat')
    expect(readFieldPath(row, [''])).toBe(3)
  })

  it('never walks prototypes or arrays and does not mutate special properties', () => {
    expect(readFieldPath(Object.create({ secret: 5 }), ['secret'])).toBeUndefined()
    expect(readFieldPath({}, ['constructor', 'name'])).toBeUndefined()
    expect(readFieldPath({ entries: [{ amount: 5 }] }, ['entries', '0', 'amount'])).toBeUndefined()
    expect(readFieldPath({ client: null }, ['client', 'name'])).toBeUndefined()
    const row = JSON.parse('{"__proto__":{"story2Marker":4},"constructor":7}')
    expect(readFieldPath(row, ['__proto__', 'story2Marker'])).toBe(4)
    expect(readFieldPath(row, ['constructor'])).toBe(7)
    expect(Object.hasOwn(Object.prototype, 'story2Marker')).toBe(false)
  })

  it.each(['', '[]', '[0]', '["client",0]', '["broken"', 'client..name'])(
    'rejects malformed or indexed path %j',
    (reference) => expect(parseFieldPath(reference)).toBeNull(),
  )
})
