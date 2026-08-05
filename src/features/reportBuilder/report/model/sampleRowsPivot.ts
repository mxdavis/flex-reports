import type { ReportRow } from '../../../../services/adapters'
import type { DisplayType, ReportField } from '../../../../services/reportDefinition/types'

// A single rendered cell in the nested pivot detail area. `render` is false for
// cells covered by a rowSpan that started higher up in the same column.
export type PivotDetailCell = {
  value: string
  rowSpan: number
  isNumeric: boolean
  render: boolean
}

export type PivotDetailRow = {
  rowId: string
  cells: PivotDetailCell[]
}

// Top-level group (by the first field). Detail rows nest additional columns via
// rowSpan so repeated parent values are shown once, spreadsheet-style.
export type NestedPivotGroup = {
  primaryValue: string
  rows: ReportRow[]
  detailRows: PivotDetailRow[]
}

type GetMappedValue = (
  row: ReportRow,
  sourceKey: string,
  displayType: DisplayType,
  currencySymbol?: string,
) => string

type BuildNestedPivotGroupsArgs = {
  previewRows: ReportRow[]
  fields: ReportField[]
  getMappedValue: GetMappedValue
  isNumericDisplayType: (displayType: DisplayType) => boolean
}

// Grouping rule: columns nest left-to-right. A cell merges with the row above
// only when it and every column to its left share the same value (prefix
// match). Grouping therefore continues for as long as the parent columns keep
// grouping and stops naturally once a parent column breaks.
export function buildNestedPivotGroups({
  previewRows,
  fields,
  getMappedValue,
  isNumericDisplayType,
}: BuildNestedPivotGroupsArgs): NestedPivotGroup[] {
  const primaryField = fields[0]
  const groupOrder: string[] = []
  const rowsByPrimary = new Map<string, ReportRow[]>()

  for (const row of previewRows) {
    const primaryValue = getMappedValue(
      row,
      primaryField.sourceKey,
      primaryField.displayType,
      primaryField.currencySymbol,
    )
    if (!rowsByPrimary.has(primaryValue)) {
      rowsByPrimary.set(primaryValue, [])
      groupOrder.push(primaryValue)
    }
    rowsByPrimary.get(primaryValue)?.push(row)
  }

  return groupOrder.map((primaryValue) => {
    const groupRows = rowsByPrimary.get(primaryValue) ?? []
    const mappedByRow = groupRows.map((row) =>
      fields.map((field) => getMappedValue(row, field.sourceKey, field.displayType, field.currencySymbol)),
    )

    // Sort within the group by every column left-to-right so equal prefixes are
    // adjacent and can be merged with rowSpan.
    const order = mappedByRow.map((_, index) => index).sort((left, right) => {
      for (let column = 0; column < fields.length; column += 1) {
        if (mappedByRow[left][column] < mappedByRow[right][column]) return -1
        if (mappedByRow[left][column] > mappedByRow[right][column]) return 1
      }
      return 0
    })

    const sortedRows = order.map((index) => groupRows[index])
    const sortedMapped = order.map((index) => mappedByRow[index])

    const prefixEqual = (rowA: number, rowB: number, throughColumn: number): boolean => {
      for (let column = 0; column <= throughColumn; column += 1) {
        if (sortedMapped[rowA][column] !== sortedMapped[rowB][column]) return false
      }
      return true
    }

    const detailRows: PivotDetailRow[] = sortedRows.map((row, rowIndex) => ({
      rowId: row.id,
      cells: fields.map((field, column) => {
        const isNumeric = isNumericDisplayType(field.displayType)
        const isStart = rowIndex === 0 || !prefixEqual(rowIndex, rowIndex - 1, column)
        if (!isStart) {
          return { value: sortedMapped[rowIndex][column], rowSpan: 0, isNumeric, render: false }
        }

        let rowSpan = 1
        while (
          rowIndex + rowSpan < sortedRows.length
          && prefixEqual(rowIndex, rowIndex + rowSpan, column)
        ) {
          rowSpan += 1
        }

        return { value: sortedMapped[rowIndex][column], rowSpan, isNumeric, render: true }
      }),
    }))

    return { primaryValue, rows: sortedRows, detailRows }
  })
}