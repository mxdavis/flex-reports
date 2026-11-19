import type { TimeslipRow } from '../../models/reportTypes'

const MOCK_ROWS: TimeslipRow[] = [
  { id: '1', workDate: '2026-07-01', employee: 'Alex', client: 'Northwind', task: 'Drafting', hours: 2.5, rate: 240 },
  { id: '2', workDate: '2026-07-01', employee: 'Sam', client: 'Northwind', task: 'Review', hours: 1.75, rate: 260 },
  { id: '3', workDate: '2026-07-02', employee: 'Alex', client: 'Delta Freight', task: 'Research', hours: 3.25, rate: 240 },
  { id: '4', workDate: '2026-07-02', employee: 'Jordan', client: 'Delta Freight', task: 'Filing', hours: 1.5, rate: 210 },
  { id: '5', workDate: '2026-07-03', employee: 'Sam', client: 'Northwind', task: 'Conference', hours: 2.0, rate: 260 },
  { id: '6', workDate: '2026-07-03', employee: 'Jordan', client: 'ACME Legal', task: 'Drafting', hours: 4.0, rate: 210 },
  { id: '7', workDate: '2026-07-06', employee: 'Alex', client: 'ACME Legal', task: 'Review', hours: 2.25, rate: 240 },
  { id: '8', workDate: '2026-07-07', employee: 'Sam', client: 'Delta Freight', task: 'Drafting', hours: 3.5, rate: 260 },
]

export function getMockTimeslipRows(): TimeslipRow[] {
  return MOCK_ROWS
}
