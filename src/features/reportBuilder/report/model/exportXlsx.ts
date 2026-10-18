import type { Row, Worksheet } from 'exceljs'
import type { ReportRow } from '../../../../services/adapters'
import type { DisplayType, ReportField } from '../../../../services/reportDefinition/types'
import { getTotalDisplayType } from './fieldTotals'
import { buildGroupTree, getTreeLayout, joinFieldLabels, type GetFieldValue, type GroupNode } from './pivotLayout'

export const XLSX_MIME_TYPE = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'

export type XlsxExportArgs = {
  sheetName: string
  currencySymbol: string
  rows: ReportRow[]
  fields: ReportField[]
  isGrouped: boolean
  showTotals: boolean
  getFieldValue: GetFieldValue
  getRawValue: (row: ReportRow, sourceKey: string) => unknown
  getFieldTotal: (rows: ReportRow[], field: ReportField) => number | null
  isGroupExpanded: (level: number, groupKey: string) => boolean
}

type CellValue = string | number | Date | null

const DATE_ONLY = /^(\d{4})-(\d{2})-(\d{2})$/
const INVALID_FORMULA = 'Invalid formula'

// Excel's own number formats, so cells stay numbers and dates.
function numberFormat(displayType: DisplayType, currencySymbol: string): string | undefined {
  const symbol = `"${currencySymbol.replace(/"/g, '')}"`
  switch (displayType) {
    case 'currency': return `${symbol}#,##0.00;-${symbol}#,##0.00`
    case 'number': return '#,##0'
    case 'decimal': return '#,##0.00'
    case 'percent': return '0.00%'
    case 'date': return 'mm/dd/yyyy'
    default: return undefined
  }
}

// Excel stores dates without a timezone, so a date-only value is written as
// that calendar day (at UTC midnight, which is how ExcelJS serializes dates).
function toExcelDate(value: unknown): Date | string | null {
  if (value === null || value === undefined || value === '') return null
  if (value instanceof Date) return value
  const text = String(value).trim()
  const dateOnly = DATE_ONLY.exec(text)
  if (dateOnly) return new Date(Date.UTC(Number(dateOnly[1]), Number(dateOnly[2]) - 1, Number(dateOnly[3])))
  const parsed = new Date(text)
  return Number.isNaN(parsed.getTime()) ? text : parsed
}

function toCellValue(value: unknown, displayType: DisplayType): CellValue {
  if (value === null || value === undefined || value === '') return null
  if (typeof value === 'number') return Number.isNaN(value) ? INVALID_FORMULA : value
  if (displayType === 'date') return toExcelDate(value)
  return String(value)
}

function toTotalValue(total: number | null): CellValue {
  if (total === null) return null
  return Number.isNaN(total) ? INVALID_FORMULA : total
}

// Excel sheet names: up to 31 characters, none of : \ / ? * [ ].
function toSheetName(name: string): string {
  return name.replace(/[:\\/?*[\]]/g, '-').trim().slice(0, 31) || 'Report'
}

function addStyledRow(sheet: Worksheet, values: CellValue[], options: { bold?: boolean, level?: number, hidden?: boolean }): Row {
  const row = sheet.addRow(values)
  if (options.bold) row.font = { bold: true }
  if (options.level) {
    row.outlineLevel = options.level
    row.getCell(1).alignment = { indent: options.level }
  }
  if (options.hidden) row.hidden = true
  return row
}

// The report as an Excel workbook: real numbers and dates with Excel formats,
// and for grouped reports Excel's own row outline, with groups that are
// collapsed on screen included but collapsed.
export async function buildXlsx(args: XlsxExportArgs): Promise<ArrayBuffer> {
  const { default: ExcelJS } = await import('exceljs')
  const { fields, rows, currencySymbol, getFieldValue, getRawValue, getFieldTotal } = args
  const workbook = new ExcelJS.Workbook()
  const sheet = workbook.addWorksheet(toSheetName(args.sheetName), {
    views: [{ state: 'frozen', ySplit: 1 }],
    properties: { outlineProperties: { summaryBelow: false, summaryRight: false } },
  })

  const labelFields = args.isGrouped ? fields.slice(0, getTreeLayout(fields).labelIndex + 1) : fields.slice(0, 1)
  const valueFields = fields.slice(labelFields.length)
  const labelField = labelFields[labelFields.length - 1]
  const header = sheet.addRow([joinFieldLabels(labelFields), ...valueFields.map((field) => field.label)])
  header.font = { bold: true }
  header.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF2F4F7' } }

  const valueCells = (row: ReportRow) => valueFields.map((field) => toCellValue(getRawValue(row, field.sourceKey), field.displayType))
  const totalCells = (groupRows: ReportRow[]) => valueFields.map((field) => toTotalValue(getFieldTotal(groupRows, field)))
  const formatTotals = (row: Row) => valueFields.forEach((field, index) => {
    row.getCell(index + 2).numFmt = numberFormat(getTotalDisplayType(field), currencySymbol) ?? 'General'
  })

  if (args.isGrouped) {
    const { groupCount } = getTreeLayout(fields)
    const addGroups = (nodes: GroupNode[], isHidden: boolean) => {
      for (const node of nodes) {
        const groupRow = addStyledRow(sheet, [node.label, ...totalCells(node.rows)], { bold: true, level: node.level, hidden: isHidden })
        formatTotals(groupRow)
        const childrenHidden = isHidden || !args.isGroupExpanded(node.level, node.groupKey)
        if (node.children.length > 0) {
          addGroups(node.children, childrenHidden)
          continue
        }
        for (const row of node.rows) {
          addStyledRow(sheet, [getFieldValue(row, labelField), ...valueCells(row)], { level: groupCount, hidden: childrenHidden })
        }
      }
    }
    addGroups(buildGroupTree({ rows, fields, getFieldValue, getRawValue }), false)
  } else {
    for (const row of rows) {
      sheet.addRow([toCellValue(getRawValue(row, labelField.sourceKey), labelField.displayType), ...valueCells(row)])
    }
  }

  // Number formats for the data cells; total rows set their own above and below.
  ;[...(args.isGrouped ? [] : [labelField]), ...valueFields].forEach((field, index) => {
    const column = sheet.getColumn(args.isGrouped ? index + 2 : index + 1)
    const format = numberFormat(field.displayType, currencySymbol)
    if (format) column.numFmt = format
  })
  // Group and total rows were formatted per cell, which takes precedence.

  if (args.showTotals) {
    const totalRow = addStyledRow(sheet, [args.isGrouped ? 'Grand total' : 'Total', ...totalCells(rows)], { bold: true })
    formatTotals(totalRow)
  }

  // Width from the longest shown value in each column (sampled), within reason.
  const sample = rows.slice(0, 500)
  sheet.columns.forEach((column, index) => {
    const field = index === 0 ? labelField : valueFields[index - 1]
    const lengths = [
      index === 0 ? joinFieldLabels(labelFields).length : field.label.length,
      ...sample.map((row) => getFieldValue(row, field).length),
    ]
    column.width = Math.min(Math.max(...lengths) + 2 + (index === 0 && args.isGrouped ? 4 : 0), 50)
  })

  return workbook.xlsx.writeBuffer() as Promise<ArrayBuffer>
}
