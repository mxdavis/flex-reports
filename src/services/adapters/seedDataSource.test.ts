import { describe, expect, it } from 'vitest'
import {
  getBillingSeed,
  getReportRows,
  getSchema,
} from './index'

describe('seedDataSource', () => {
  it('loads seed content', () => {
    const seed = getBillingSeed()

    expect(seed.personBilling.length).toBeGreaterThan(0)
    expect(seed.client.length).toBeGreaterThan(0)
    expect(seed.personClientTime.length).toBeGreaterThan(0)
    expect(seed.formulas.length).toBe(3)
  })

  it('maps raw rows without applying formulas', () => {
    const rows = getReportRows()
    const first = rows[0]

    expect(rows.length).toBe(20)
    expect(first.total).toBeCloseTo(first.hours * first.rate, 6)
    expect(first).not.toHaveProperty('grossFees')
    expect(first).not.toHaveProperty('writeDown')
    expect(first).not.toHaveProperty('netFees')
  })

  it('exposes schema for report-definition defaults', () => {
    const schema = getSchema()

    expect(schema.length).toBeGreaterThan(0)
    expect(schema.find((field) => field.key === 'workDate')?.dataType).toBe('date')
    expect(schema.find((field) => field.key === 'total')?.dataType).toBe('currency')
  })
})
