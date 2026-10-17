import type { ReportRow } from '../../../../services/adapters'
import type { DisplayType, ReportField } from '../../../../services/reportDefinition/types'
import { isNumericDisplayType, isNumericTotal } from './fieldTotals'

// A single rendered cell in the nested pivot output. Only cells that are
// actually rendered are present; cells covered by a rowSpan that began higher in
// the same column are simply omitted from the row.
export type PivotCell = {
  columnIndex: number
  tag: 'th' | 'td'
  scope?: 'rowgroup' | 'row'
  value: string
  rowSpan: number
  isNumeric: boolean
  emphasis: boolean
  // Present on grouping-value cells: the group can be expanded or collapsed.
  toggle?: { groupKey: string, isExpanded: boolean }
}

export type PivotRenderRow = {
  key: string
  kind: 'detail' | 'subtotal' | 'collapsed'
  cells: PivotCell[]
}

type GetMappedValue = (
  row: ReportRow,
  sourceKey: string,
  displayType: DisplayType,
  currencySymbol?: string,
) => string

type GetRawValue = (row: ReportRow, sourceKey: string) => unknown

function isBlank(value: unknown): boolean {
  return value === null || value === undefined || value === '' || (typeof value === 'number' && Number.isNaN(value))
}

// Sort on the underlying value, not the formatted text, so $1,000 sorts after
// $240 and dates sort chronologically. Blanks go last.
export function compareRawValues(left: unknown, right: unknown): number {
  if (isBlank(left) || isBlank(right)) return Number(isBlank(left)) - Number(isBlank(right))
  if (left instanceof Date && right instanceof Date) return left.getTime() - right.getTime()
  if (typeof left === 'number' && typeof right === 'number') return left - right
  return String(left).localeCompare(String(right), undefined, { numeric: true, sensitivity: 'base' })
}

type BuildPivotRenderRowsArgs = {
  rows: ReportRow[]
  fields: ReportField[]
  showTotals: boolean
  getMappedValue: GetMappedValue
  getRawValue: GetRawValue
  formatFieldTotal: (rows: ReportRow[], field: ReportField) => string
  isGroupExpanded: (level: number, groupKey: string) => boolean
}

// Grouping nests left to right and stops at the first number column, so
// measures (hours, prices, totals) stay values instead of becoming groups.
// With no number columns, every column but the last is a group.
export function getGroupLevelCount(fields: ReportField[]): number {
  const firstNumericColumn = fields.findIndex((field) => isNumericDisplayType(field.displayType))
  return firstNumericColumn === -1 ? Math.max(fields.length - 1, 0) : firstNumericColumn
}

// Stable id for a group: its value at every level down to its own, so
// "Alex Rivera > Delta Freight" and "Sam Patel > Delta Freight" differ.
export function getGroupKey(path: string[]): string {
  return JSON.stringify(path)
}

// Grouping rule: the leading columns nest left-to-right (see
// getGroupLevelCount); the remaining columns are shown per row. When totals are on, every group gets a total row, using each
// column's own aggregation. Grouping-value cells use rowSpan so repeated
// parent values render once, spreadsheet-style; their span covers nested
// total rows but stops before the group's own total row. A collapsed group
// renders as a single row: its value plus its totals.
export function buildPivotRenderRows({
  rows,
  fields,
  showTotals,
  getMappedValue,
  getRawValue,
  formatFieldTotal,
  isGroupExpanded,
}: BuildPivotRenderRowsArgs): PivotRenderRow[] {
  const groupLevelCount = getGroupLevelCount(fields)
  if (groupLevelCount === 0 || rows.length === 0) return []

  const mapped = rows.map((row) =>
    fields.map((field) => getMappedValue(row, field.sourceKey, field.displayType, field.currencySymbol)),
  )

  const raw = rows.map((row) => fields.map((field) => getRawValue(row, field.sourceKey)))

  const order = rows.map((_, index) => index).sort((left, right) => {
    for (let column = 0; column < fields.length; column += 1) {
      const comparison = compareRawValues(raw[left][column], raw[right][column])
      if (comparison !== 0) return comparison
    }
    return 0
  })

  const sortedRows = order.map((index) => rows[index])
  const sortedMapped = order.map((index) => mapped[index])

  const buildTotalCells = (level: number, indices: number[]): PivotCell[] => {
    const blockRows = indices.map((index) => sortedRows[index])
    const cells: PivotCell[] = []
    for (let column = level + 1; column < fields.length; column += 1) {
      const field = fields[column]
      cells.push({
        columnIndex: column,
        tag: 'td',
        value: formatFieldTotal(blockRows, field),
        rowSpan: 1,
        isNumeric: isNumericTotal(field),
        emphasis: true,
      })
    }
    return cells
  }

  const buildSubtotalRow = (level: number, value: string, groupKey: string, indices: number[]): PivotRenderRow => ({
    key: `subtotal-${groupKey}`,
    kind: 'subtotal',
    cells: [
      { columnIndex: level, tag: 'th', scope: 'row', value: `${value} Total`, rowSpan: 1, isNumeric: false, emphasis: true },
      ...buildTotalCells(level, indices),
    ],
  })

  const buildCollapsedRow = (level: number, value: string, groupKey: string, indices: number[]): PivotRenderRow => ({
    key: `collapsed-${groupKey}`,
    kind: 'collapsed',
    cells: [
      {
        columnIndex: level,
        tag: 'th',
        scope: 'row',
        value,
        rowSpan: 1,
        isNumeric: false,
        emphasis: true,
        toggle: { groupKey, isExpanded: false },
      },
      ...buildTotalCells(level, indices),
    ],
  })

  const buildDetailRows = (indices: number[]): PivotRenderRow[] => indices.map((index) => ({
    key: `detail-${sortedRows[index].id}`,
    kind: 'detail',
    cells: fields.slice(groupLevelCount).map((field, offset) => ({
      columnIndex: groupLevelCount + offset,
      tag: 'td',
      value: sortedMapped[index][groupLevelCount + offset],
      rowSpan: 1,
      isNumeric: isNumericDisplayType(field.displayType),
      emphasis: false,
    })),
  }))

  const process = (indices: number[], level: number, parentPath: string[]): PivotRenderRow[] => {
    if (level >= groupLevelCount) {
      return buildDetailRows(indices)
    }

    const output: PivotRenderRow[] = []
    let cursor = 0
    while (cursor < indices.length) {
      const value = sortedMapped[indices[cursor]][level]
      let count = 1
      while (
        cursor + count < indices.length
        && sortedMapped[indices[cursor + count]][level] === value
      ) {
        count += 1
      }

      const blockIndices = indices.slice(cursor, cursor + count)
      const path = [...parentPath, value]
      const groupKey = getGroupKey(path)
      cursor += count

      if (!isGroupExpanded(level, groupKey)) {
        output.push(buildCollapsedRow(level, value, groupKey, blockIndices))
        continue
      }

      const childRows = process(blockIndices, level + 1, path)
      const groupCell: PivotCell = {
        columnIndex: level,
        tag: level === 0 ? 'th' : 'td',
        scope: level === 0 ? 'rowgroup' : undefined,
        value,
        rowSpan: childRows.length,
        isNumeric: isNumericDisplayType(fields[level].displayType),
        emphasis: false,
        toggle: { groupKey, isExpanded: true },
      }
      childRows[0] = { ...childRows[0], cells: [groupCell, ...childRows[0].cells] }
      output.push(...childRows)

      if (showTotals) {
        output.push(buildSubtotalRow(level, value, groupKey, blockIndices))
      }
    }
    return output
  }

  return process(sortedRows.map((_, index) => index), 0, [])
}
