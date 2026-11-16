import type { ReportRow } from '../../../../services/adapters'
import type { ReportField } from '../../../../services/reportDefinition/types'
import type { GetFieldValue } from './pivotLayout'

// Excel reads a CSV as UTF-8 only when it starts with this byte-order mark.
const UTF8_BOM = '﻿'
// Spreadsheets treat a cell starting with these as a formula.
const FORMULA_TRIGGER = /^[=+\-@\t\r]/

function escapeCell(value: string, isText: boolean): string {
  // Neutralize formulas in text taken from the data (CSV injection). Numbers
  // and dates are produced by the builder, so a leading "-" there is a sign.
  const safe = isText && FORMULA_TRIGGER.test(value) ? `'${value}` : value
  return /[",\r\n]/.test(safe) ? `"${safe.replace(/"/g, '""')}"` : safe
}

// Every data row, with the report's columns and headers, formatted as shown on
// screen. Group and total rows aren't included.
export function buildCsv(rows: ReportRow[], fields: ReportField[], getFieldValue: GetFieldValue): string {
  const lines = [
    fields.map((field) => escapeCell(field.label, true)).join(','),
    ...rows.map((row) => fields
      .map((field) => escapeCell(getFieldValue(row, field), field.displayType === 'string'))
      .join(',')),
  ]
  return `${UTF8_BOM}${lines.join('\r\n')}\r\n`
}
