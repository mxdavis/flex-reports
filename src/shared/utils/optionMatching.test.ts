import { describe, expect, it } from 'vitest'
import { filterOptions, findTypedOption } from './optionMatching'

describe('filterOptions', () => {
  it('keeps unique options containing the query, ignoring case and order', () => {
    expect(filterOptions(['Units', 'price', 'units', 'Unit cost'], ' UNIT ')).toEqual(['Units', 'units', 'Unit cost'])
    expect(filterOptions(['b', 'a', 'b'], '')).toEqual(['b', 'a'])
  })
})

describe('findTypedOption', () => {
  const options = ['hours', 'client.id', 'client.name']

  it('matches ignoring case, preferring the exact spelling when options differ only by case', () => {
    expect(findTypedOption(' Hours ', options)).toBe('hours')
    expect(findTypedOption('hou', options)).toBeNull()
    expect(findTypedOption('', options)).toBeNull()

    const clashing = ['client.name', 'Client.name']
    expect(findTypedOption('Client.name', clashing)).toBe('Client.name')
    expect(findTypedOption('CLIENT.NAME', clashing)).toBeNull()
  })
})
