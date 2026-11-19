import type { ReportFormula, ReportRow } from '../../../../services/adapters'
import { getFormulaReferences } from '../../../../services/formula/formulaReferences'
import { getFormulaError } from '../../../../services/reportDefinition/rules'
import type { ReportField } from '../../../../services/reportDefinition/types'
import { isBlankReportValue, isValidReportDate, parseReportNumber } from '../../../../utils/reportBuilder'
import { isNumericDisplayType } from './fieldTotals'

type NonNumbers = { count: number, firstRow: number, firstValue: unknown }

function findNonNumbers(rows: ReportRow[], getValue: (row: ReportRow) => unknown): NonNumbers | undefined {
  let found: NonNumbers | undefined
  rows.forEach((row, index) => {
    const value = getValue(row)
    if (isBlankReportValue(value) || parseReportNumber(value) !== undefined) return
    if (found) found.count += 1
    else found = { count: 1, firstRow: index + 1, firstValue: value }
  })
  return found
}

function describeExample({ firstRow, firstValue }: NonNumbers): string {
  return `row ${firstRow}: ${JSON.stringify(firstValue)}`
}

function describeNonNumbers(nonNumbers: NonNumbers): string {
  const { count } = nonNumbers
  const example = describeExample(nonNumbers)
  return count === 1
    ? `1 value isn't a number (${example}). It's shown as entered, left out of totals, and counted as 0 in formulas.`
    : `${count.toLocaleString('en-US')} values aren't numbers (first in ${example}). They're shown as entered, left out of totals, and counted as 0 in formulas.`
}

// For a formula: a field it uses has values that aren't numbers, like a
// spreadsheet cell a formula relies on that holds text.
function describeFormulaNonNumbers(fieldName: string, nonNumbers: NonNumbers): string {
  const { count } = nonNumbers
  const example = describeExample(nonNumbers)
  return count === 1
    ? `${fieldName} has 1 value that isn't a number (${example}). It's counted as 0.`
    : `${fieldName} has ${count.toLocaleString('en-US')} values that aren't numbers (first in ${example}). They're counted as 0.`
}

type ReportIssuesArgs = {
  rows: ReportRow[]
  fields: ReportField[]
  formulas: ReportFormula[]
  getMappedRawValue: (row: ReportRow, sourceKey: string) => unknown
  // True for a field from the data (not a formula).
  isDataField: (sourceKey: string) => boolean
}

// Problems in the data that change what the report shows: invalid dates, text
// in number columns, and formulas that fail or use fields holding text.
export function findReportIssues({ rows, fields, formulas, getMappedRawValue, isDataField }: ReportIssuesArgs): string[] {
  const issues: string[] = []
  for (const field of fields) {
    if (rows.length === 0) continue
    if (field.displayType === 'date' && rows.some((row) => {
      const value = getMappedRawValue(row, field.sourceKey)
      return !isBlankReportValue(value) && !isValidReportDate(value)
    })) {
      issues.push(`Column ${field.label}: use valid dates. Original values are shown.`)
    }
    const nonNumbers = isNumericDisplayType(field.displayType) && isDataField(field.sourceKey)
      ? findNonNumbers(rows, (row) => getMappedRawValue(row, field.sourceKey))
      : undefined
    if (nonNumbers) issues.push(`Column ${field.label}: ${describeNonNumbers(nonNumbers)}`)
  }
  for (const formula of formulas) {
    // Reuses the per-row values the table already computed.
    if (rows.some((row) => !Number.isFinite(getMappedRawValue(row, `%${formula.label}`) as number))) {
      issues.push(`Formula ${formula.label}: check references, circular dependencies, and arithmetic.`)
    }
    const fieldNames = new Set(getFormulaReferences(formula.expression).map((token) => token.reference.trim()))
    for (const fieldName of fieldNames) {
      const nonNumbers = isDataField(fieldName) && findNonNumbers(rows, (row) => getMappedRawValue(row, fieldName))
      if (nonNumbers) issues.push(`Formula ${formula.label}: ${describeFormulaNonNumbers(fieldName, nonNumbers)}`)
    }
  }
  return issues
}

// Notes for editors about saved formulas that need their attention. Saved
// formulas are never dropped or renamed: they keep working as far as they
// can, and the editor decides what to change. A formula sharing a name with a
// data field keeps working too (%Fee is the formula, Fee the field).
export function findFormulaNotes(formulas: ReportFormula[], fieldKeys: string[]): string[] {
  const fieldNames = new Set(fieldKeys.map((key) => key.toLowerCase()))
  return formulas.flatMap((formula) => {
    const problem = getFormulaError(formula, { existingLabels: [] })
    if (problem) return [formula.label.trim() ? `Formula "${formula.label}": ${problem}` : `A formula has no label: ${problem}`]
    if (fieldNames.has(formula.label.trim().toLowerCase())) {
      return [`Your data now has a field called ${formula.label}, the same name as your formula. Rename the formula so they don't get mixed up.`]
    }
    return []
  })
}
