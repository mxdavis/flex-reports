import { afterEach, describe, expect, it, vi } from 'vitest'
import { formatCellValue, getNextSequencedName, isValidReportDate, parseReportNumber, toReportNumber } from './reportBuilder'

describe('getNextSequencedName', () => {
  it('continues the highest number in the series', () => {
    expect(getNextSequencedName('field-', ['field-1', 'field-4', 'units'])).toBe('field-5')
    expect(getNextSequencedName('formula', ['formula2', 'formulaX', 'net'])).toBe('formula3')
  })

  it('starts at 1 when nothing is in the series', () => {
    expect(getNextSequencedName('field-', [])).toBe('field-1')
    expect(getNextSequencedName('formula', ['gross'])).toBe('formula1')
  })
})

describe('formatCellValue', () => {
  it('formats numbers by display type', () => {
    expect(formatCellValue(1234.5, 'currency', { currencySymbol: '€' })).toBe('€1,234.50')
    expect(formatCellValue(-3, 'currency')).toBe('-$3.00')
    expect(formatCellValue(1234.5, 'number')).toBe('1,235')
    expect(formatCellValue(0.25, 'percent')).toBe('25.00%')
  })

  it('shows a broken formula as "Invalid formula", like totals do', () => {
    expect(formatCellValue(Number.NaN, 'decimal')).toBe('Invalid formula')
  })

  it('leaves blanks empty and unparseable dates as typed', () => {
    expect(formatCellValue(null, 'string')).toBe('')
    expect(formatCellValue('not a date', 'date')).toBe('not a date')
  })
})

describe('formatCellValue dates across timezones', () => {
  // The date formatter is built when the module loads, in the timezone of that
  // moment, so each case loads a fresh copy under its own timezone.
  async function formatIn(timezone: string, value: string): Promise<string> {
    vi.stubEnv('TZ', timezone)
    vi.resetModules()
    const { formatCellValue: format } = await import('./reportBuilder')
    return format(value, 'date')
  }

  afterEach(() => {
    vi.unstubAllEnvs()
    vi.resetModules()
  })

  it.each(['America/Los_Angeles', 'America/New_York', 'UTC', 'Asia/Tokyo', 'Pacific/Kiritimati'])(
    'shows a date-only value as the same calendar day in %s',
    async (timezone) => {
      expect(await formatIn(timezone, '2026-07-01')).toBe('07/01/2026')
      expect(await formatIn(timezone, '2026-12-31')).toBe('12/31/2026')
    },
  )

  it('converts a value with a time to the viewer\'s local day', async () => {
    // 03:00 UTC on July 2nd is still July 1st in Los Angeles.
    expect(await formatIn('America/Los_Angeles', '2026-07-02T03:00:00Z')).toBe('07/01/2026')
  })
})

describe('explicit numeric interpretation', () => {
  it.each([
    ['250', 250], ['  -12.5 ', -12.5], ['.75', .75], ['+2e2', 200], [2.75, 2.75],
    ['1,000', 1000], ['-1,250.50', -1250.5], ['$250', 0], ['-$1,250.50', 0], ['120USD', 0], ['US120', 0],
    ['250abc', 0], ['0x10', 0], ['0b10', 0], ['1,00', 0], ['1e999', 0], ['€5', 0],
    ['', 0], [' ', 0], [null, 0], [undefined, 0], [true, 0], [{}, 0], [[2], 0], [NaN, 0], [Infinity, 0],
  ])('interprets %j as %s', (input, expected) => expect(toReportNumber(input)).toBe(expected))

  it('does not read currency symbols, and tells blanks apart from non-numbers', () => {
    expect(parseReportNumber('$40')).toBeUndefined()
    expect(parseReportNumber('€1,250')).toBeUndefined()
    expect(parseReportNumber('  ')).toBeUndefined()
    expect(parseReportNumber('N/A')).toBeUndefined()
  })

  it('rounds presentation only and keeps original text in String mode', () => {
    expect(formatCellValue('12.5', 'number')).toBe('13')
    expect(toReportNumber('12.5')).toBe(12.5)
    expect(formatCellValue('250.50', 'currency', { currencySymbol: '€' })).toBe('€250.50')
    expect(formatCellValue('bad', 'currency')).toBe('bad')
    expect(formatCellValue(null, 'decimal')).toBe('')
    expect(formatCellValue('', 'currency')).toBe('')
    expect(formatCellValue('$1,250.00', 'currency')).toBe('$1,250.00')
    expect(formatCellValue('€1.234,50', 'currency', { currencySymbol: '€' })).toBe('€1.234,50')
    expect(formatCellValue('0.25', 'percent')).toBe('25.00%')
    expect(formatCellValue('250.50', 'string')).toBe('250.50')
    expect(formatCellValue(null, 'string')).toBe('')
    expect(formatCellValue('null', 'string')).toBe('null')
    expect(formatCellValue(new Date('2026-07-01T00:00:00.000Z'), 'string')).toBe('2026-07-01T00:00:00.000Z')
  })

  it('validates calendar dates and avoids timezone shifts', () => {
    expect(isValidReportDate('2024-02-29')).toBe(true)
    expect(isValidReportDate('2025-02-29')).toBe(false)
    expect(isValidReportDate('07/01/2026')).toBe(true)
    expect(formatCellValue('2026-07-01', 'date')).toBe('07/01/2026')
    expect(formatCellValue('not a date', 'date')).toBe('not a date')
  })
})
