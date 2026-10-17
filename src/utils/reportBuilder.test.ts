import { describe, expect, it } from 'vitest'
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
