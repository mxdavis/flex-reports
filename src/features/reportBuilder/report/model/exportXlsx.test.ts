import ExcelJS from 'exceljs'
import { describe, expect, it } from 'vitest'
import type { ReportRow } from '../../../../services/adapters'
import type { ReportField } from '../../../../services/reportDefinition/types'
import { plainFieldValue, rawValue } from '../../../../test/simpleFieldTotal'
import { buildXlsx, type XlsxExportArgs } from './exportXlsx'
import { getGroupKey } from './pivotLayout'

function field(id: string, displayType: ReportField['displayType'], aggregation: ReportField['aggregation'] = 'none'): ReportField {
  return { id, label: id[0].toUpperCase() + id.slice(1), sourceKey: id, displayType, aggregation }
}

const fields = [field('region', 'string'), field('store', 'string'), field('soldOn', 'date'), field('price', 'currency', 'avg'), field('units', 'number', 'sum')]
const rows: ReportRow[] = [
  { id: '1', region: 'North', store: 'Ames', soldOn: '2026-07-01', price: 10, units: 2 },
  { id: '2', region: 'North', store: 'Boone', soldOn: '2026-07-02', price: 20, units: 3 },
  { id: '3', region: 'South', store: 'Cary', soldOn: '2026-07-03', price: Number.NaN, units: 4 },
]

function sumOrAvg(groupRows: ReportRow[], target: ReportField): number | null {
  const values = groupRows.map((row) => row[target.sourceKey]).filter((value): value is number => typeof value === 'number' && Number.isFinite(value))
  if (target.aggregation === 'none' || values.length === 0) return null
  const sum = values.reduce((total, value) => total + value, 0)
  return target.aggregation === 'avg' ? sum / values.length : sum
}

async function exportAndRead(overrides: Partial<XlsxExportArgs> = {}) {
  const buffer = await buildXlsx({
    sheetName: 'Q3: Sales/Region',
    currencySymbol: '€',
    rows,
    fields,
    isGrouped: false,
    showTotals: true,
    getFieldValue: plainFieldValue,
    getRawValue: rawValue,
    getFieldTotal: sumOrAvg,
    isGroupExpanded: () => true,
    ...overrides,
  })
  const workbook = new ExcelJS.Workbook()
  await workbook.xlsx.load(buffer)
  return workbook.worksheets[0]
}

function rowValues(sheet: ExcelJS.Worksheet, rowNumber: number): unknown[] {
  return (sheet.getRow(rowNumber).values as unknown[]).slice(1)
}

describe('buildXlsx', () => {
  it('writes real numbers and dates with Excel formats, a frozen header, and a total row', async () => {
    const sheet = await exportAndRead()

    expect(sheet.name).toBe('Q3- Sales-Region')
    expect(sheet.views[0]).toMatchObject({ state: 'frozen', ySplit: 1 })
    expect(rowValues(sheet, 1)).toEqual(['Region', 'Store', 'SoldOn', 'Price', 'Units'])
    expect(sheet.getRow(1).font?.bold).toBe(true)

    const first = sheet.getRow(2)
    expect(first.getCell(4).value).toBe(10)
    expect(first.getCell(4).numFmt).toBe('"€"#,##0.00;-"€"#,##0.00')
    expect(first.getCell(5).numFmt).toBe('#,##0')
    // A date-only value is that calendar day, whatever the timezone.
    expect((first.getCell(3).value as Date).toISOString()).toBe('2026-07-01T00:00:00.000Z')
    expect(first.getCell(3).numFmt).toBe('mm/dd/yyyy')

    expect(sheet.getRow(4).getCell(4).value).toBe('Invalid formula')
    expect(rowValues(sheet, 5)).toEqual(['Total', undefined, undefined, 15, 9])
    expect(sheet.getRow(5).font?.bold).toBe(true)
  })

  it('leaves the total row out when totals are off', async () => {
    const sheet = await exportAndRead({ showTotals: false })

    expect(sheet.rowCount).toBe(4)
  })

  it('writes groups as an Excel outline, with collapsed groups included but hidden', async () => {
    const twoLevels = [field('region', 'string'), field('store', 'string'), field('units', 'number', 'sum')]
    const sheet = await exportAndRead({
      fields: twoLevels,
      isGrouped: true,
      isGroupExpanded: (_level, groupKey) => groupKey !== getGroupKey(['South']),
    })

    expect(sheet.properties.outlineProperties).toMatchObject({ summaryBelow: false })
    const summary = Array.from({ length: sheet.rowCount - 1 }, (_, index) => {
      const row = sheet.getRow(index + 2)
      return [row.getCell(1).value, row.getCell(2).value, row.outlineLevel, row.hidden]
    })
    expect(summary).toEqual([
      ['North', 5, 0, false],
      ['Ames', 2, 1, false],
      ['Boone', 3, 1, false],
      ['South', 4, 0, false],
      // Under a group collapsed on screen: present, but hidden until expanded in Excel.
      ['Cary', 4, 1, true],
      ['Grand total', 9, 0, false],
    ])
    expect(rowValues(sheet, 1)).toEqual(['Region › Store', 'Units'])
    expect(sheet.getRow(3).getCell(1).alignment).toMatchObject({ indent: 1 })
  })

  it('keeps each total\'s own format: a count in a currency column is a plain count', async () => {
    const countedPrices = [field('region', 'string'), field('store', 'string'), { ...field('price', 'currency'), aggregation: 'count' as const }]
    const counts = (groupRows: ReportRow[]) => groupRows.length
    const sheet = await exportAndRead({ fields: countedPrices, isGrouped: true, getFieldTotal: counts })

    const formatOf = (label: string) => {
      for (let rowNumber = 2; rowNumber <= sheet.rowCount; rowNumber += 1) {
        const row = sheet.getRow(rowNumber)
        if (row.getCell(1).value === label) return row.getCell(2).numFmt
      }
      return 'missing'
    }
    // Group totals and the grand total are counts; detail rows keep the currency format.
    expect(formatOf('North')).toBe('#,##0')
    expect(formatOf('Grand total')).toBe('#,##0')
    expect(formatOf('Ames')).toBe('"€"#,##0.00;-"€"#,##0.00')
  })
})
