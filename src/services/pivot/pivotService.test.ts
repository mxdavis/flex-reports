import { describe, expect, it } from 'vitest'
import { pivotByEmployee } from './pivotService'

describe('pivotByEmployee', () => {
  it('groups rows by employee and sums gross fees', () => {
    const rows = [
      { id: '1', workDate: '2026-07-01', employee: 'Alex', client: 'A', task: 'Drafting', hours: 2, rate: 100 },
      { id: '2', workDate: '2026-07-01', employee: 'Alex', client: 'A', task: 'Review', hours: 1, rate: 100 },
      { id: '3', workDate: '2026-07-02', employee: 'Sam', client: 'B', task: 'Call', hours: 3, rate: 200 },
    ]

    const result = pivotByEmployee(rows)

    expect(result).toEqual([
      { group: 'Sam', totalHours: 3, grossFees: 600 },
      { group: 'Alex', totalHours: 3, grossFees: 300 },
    ])
  })
})
