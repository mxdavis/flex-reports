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

    expect(rows.length).toBeGreaterThan(26)
    expect(first.total).toBeCloseTo(first.hours * first.rate, 6)
    expect(first).not.toHaveProperty('grossFees')
    expect(first).not.toHaveProperty('writeDown')
    expect(first).not.toHaveProperty('netFees')
  })

  it('includes same-day multi-client assignments and overlapping rates across people', () => {
    const rows = getReportRows()

    const hasPersonWorkingMultipleClientsInOneDay = rows.some((row) => {
      const clientsForPersonOnDate = new Set(
        rows
          .filter((candidate) => {
            return candidate.personId === row.personId && candidate.workDate === row.workDate
          })
          .map((candidate) => candidate.clientId),
      )

      return clientsForPersonOnDate.size > 1
    })

    const peopleByRate = new Map<number, Set<string>>()
    for (const row of rows) {
      if (!peopleByRate.has(row.rate)) {
        peopleByRate.set(row.rate, new Set())
      }
      peopleByRate.get(row.rate)?.add(row.personId)
    }
    const hasOverlappingRatesAcrossPeople = Array.from(peopleByRate.values()).some((people) => people.size > 1)

    expect(hasPersonWorkingMultipleClientsInOneDay).toBe(true)
    expect(hasOverlappingRatesAcrossPeople).toBe(true)
  })

  it('exposes schema for report-definition defaults', () => {
    const schema = getSchema()

    expect(schema.length).toBeGreaterThan(0)
    expect(schema.find((field) => field.key === 'workDate')?.dataType).toBe('date')
    expect(schema.find((field) => field.key === 'total')?.dataType).toBe('currency')
  })
})
