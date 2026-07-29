import { describe, expect, it } from 'vitest'
import {
  getBillingSeed,
  getReportRows,
  getRevenueByPerson,
  getTotalRevenue,
} from './index'

describe('seedDataSource', () => {
  it('loads seed content', () => {
    const seed = getBillingSeed()

    expect(seed.personBilling.length).toBeGreaterThan(0)
    expect(seed.client.length).toBeGreaterThan(0)
    expect(seed.personClientTime.length).toBeGreaterThan(0)
    expect(seed.formulas.length).toBe(3)
  })

  it('maps rows and evaluates seeded formulas', () => {
    const rows = getReportRows()
    const first = rows[0]

    expect(rows.length).toBe(20)
    expect(first.grossFees).toBeCloseTo(first.hours * first.rate, 6)
    expect(first.writeDown).toBeCloseTo(first.grossFees * 0.1, 6)
    expect(first.netFees).toBeCloseTo(first.grossFees - first.writeDown, 6)
  })

  it('computes revenue summaries from seed rows', () => {
    const rows = getReportRows()
    const revenue = getTotalRevenue(rows)
    const perPerson = getRevenueByPerson(rows)

    expect(revenue).toBeGreaterThan(0)
    expect(perPerson.length).toBeGreaterThan(0)
    expect(perPerson[0].totalRevenue).toBeGreaterThanOrEqual(
      perPerson[perPerson.length - 1].totalRevenue,
    )
  })
})
