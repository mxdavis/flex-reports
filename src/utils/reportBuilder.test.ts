import { afterEach, describe, expect, it, vi } from 'vitest'
import { formatCellValue, getNextSequencedName } from './reportBuilder'

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
