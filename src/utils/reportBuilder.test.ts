import { describe, expect, it } from 'vitest'
import { formatCellValue, isValidReportDate, toReportNumber } from './reportBuilder'

describe('explicit numeric interpretation', () => {
  it.each([
    ['250', 250], ['  -12.5 ', -12.5], ['.75', .75], ['+2e2', 200], [2.75, 2.75],
    ['250abc', 0], ['0x10', 0], ['0b10', 0], ['$250', 0], ['1,000', 0], ['1e999', 0],
    ['', 0], [' ', 0], [null, 0], [undefined, 0], [true, 0], [{}, 0], [[2], 0], [NaN, 0], [Infinity, 0],
  ])('interprets %j as %s', (input, expected) => expect(toReportNumber(input)).toBe(expected))

  it('rounds presentation only and keeps original text in String mode', () => {
    expect(formatCellValue('12.5', 'number')).toBe('13')
    expect(toReportNumber('12.5')).toBe(12.5)
    expect(formatCellValue('250.50', 'currency', { currencySymbol: '€' })).toBe('€250.50')
    expect(formatCellValue('bad', 'currency')).toBe('$0.00')
    expect(formatCellValue(null, 'decimal')).toBe('0.00')
    expect(formatCellValue('0.25', 'percent')).toBe('25.00%')
    expect(formatCellValue('250.50', 'string')).toBe('250.50')
    expect(formatCellValue(null, 'string')).toBe('')
    expect(formatCellValue('null', 'string')).toBe('null')
  })

  it('validates calendar dates and avoids timezone shifts', () => {
    expect(isValidReportDate('2024-02-29')).toBe(true)
    expect(isValidReportDate('2025-02-29')).toBe(false)
    expect(isValidReportDate('07/01/2026')).toBe(false)
    expect(formatCellValue('2026-07-01', 'date')).toBe('07/01/2026')
    expect(formatCellValue('not a date', 'date')).toBe('not a date')
  })
})
