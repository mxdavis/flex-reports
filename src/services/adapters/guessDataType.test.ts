import { describe, expect, it } from 'vitest'
import { guessDataType } from './guessDataType'

describe('guessDataType', () => {
  it.each([
    ['numbers', [2.5, 1, -3], 'number'],
    ['numeric text', ['4', '1,250.50', ' 7 '], 'number'],
    ['numbers with blanks', [2, null, undefined, '', 5], 'number'],
    ['ISO dates', ['2026-07-01', '2026-12-31'], 'date'],
    ['ISO date-times', ['2026-07-01T09:30:00Z', '2026-07-01T09:30'], 'date'],
    ['Date objects', [new Date(2026, 6, 1)], 'date'],
    ['dates with blanks', ['2026-07-01', null], 'date'],
    ['text', ['Drafting', 'Review'], 'string'],
    ['numbers mixed with text', [2, 'N/A'], 'string'],
    ['currency text', ['$40', '$12'], 'string'],
    ['codes with leading zeros', ['02134', '00501'], 'string'],
    ['impossible dates', ['2026-02-30'], 'string'],
    ['other date formats', ['07/01/2026', 'July 1, 2026'], 'string'],
    ['booleans', [true, false], 'string'],
    ['all blank', [null, '', undefined], 'string'],
    ['no values', [], 'string'],
  ])('%s → %s', (_name, values, dataType) => {
    expect(guessDataType(values)).toBe(dataType)
  })

  it('keeps 0 and decimals below 1 as numbers', () => {
    expect(guessDataType(['0', '0.5', '-0.25'])).toBe('number')
  })
})
