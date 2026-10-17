import type { ReportRow } from '../../../../services/adapters'
import type { DisplayType, ReportField } from '../../../../services/reportDefinition/types'
import { isNumericDisplayType, isNumericTotal } from './fieldTotals'

export type TreeCell = {
  value: string
  isNumeric: boolean
}

// The grouped table is a flat list of rows, so it can be windowed: only the
// rows on screen are drawn. Group rows carry their group's totals; detail rows
// are the data rows under the deepest group.
export type TreeRow =
  | { kind: 'group', key: string, level: number, label: string, groupKey: string, isExpanded: boolean, values: TreeCell[] }
  | { kind: 'detail', key: string, level: number, label: string, values: TreeCell[] }

export type TreeLayout = {
  // Leading columns that nest as groups.
  groupCount: number
  // The column that names each detail row, or -1 when the first column is a number.
  labelIndex: number
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

// One collator for every comparison: localeCompare with options builds one per
// call, which made sorting large reports slow.
const COLLATOR = new Intl.Collator(undefined, { numeric: true, sensitivity: 'base' })

// Sort on the underlying value, not the formatted text, so $1,000 sorts after
// $240 and dates sort chronologically. Blanks go last.
export function compareRawValues(left: unknown, right: unknown): number {
  if (isBlank(left) || isBlank(right)) return Number(isBlank(left)) - Number(isBlank(right))
  if (left instanceof Date && right instanceof Date) return left.getTime() - right.getTime()
  if (typeof left === 'number' && typeof right === 'number') return left - right
  return COLLATOR.compare(String(left), String(right))
}

// The leading text columns (up to the first number column) drive grouping: the
// last of them names each row, and the ones before it nest as groups. Number
// columns and anything after them are values. With no number columns, the last
// column names each row.
export function getTreeLayout(fields: ReportField[]): TreeLayout {
  const firstNumericColumn = fields.findIndex((field) => isNumericDisplayType(field.displayType))
  const textColumnCount = firstNumericColumn === -1 ? fields.length : firstNumericColumn
  const labelIndex = textColumnCount - 1
  return { groupCount: Math.max(labelIndex, 0), labelIndex }
}

// Stable id for a group: its value at every level down to its own, so
// "Alex Rivera > Delta Freight" and "Sam Patel > Delta Freight" differ.
export function getGroupKey(path: string[]): string {
  return JSON.stringify(path)
}

type BuildTreeRowsArgs = {
  rows: ReportRow[]
  fields: ReportField[]
  showTotals: boolean
  getMappedValue: GetMappedValue
  getRawValue: GetRawValue
  formatFieldTotal: (rows: ReportRow[], field: ReportField) => string
  isGroupExpanded: (level: number, groupKey: string) => boolean
}

export function buildTreeRows({
  rows,
  fields,
  showTotals,
  getMappedValue,
  getRawValue,
  formatFieldTotal,
  isGroupExpanded,
}: BuildTreeRowsArgs): TreeRow[] {
  const { groupCount, labelIndex } = getTreeLayout(fields)
  if (groupCount === 0 || rows.length === 0) return []

  const valueFields = fields.slice(labelIndex + 1)
  const sortFields = fields.slice(0, labelIndex + 1)
  const raw = rows.map((row) => sortFields.map((field) => getRawValue(row, field.sourceKey)))
  const order = rows.map((_, index) => index).sort((left, right) => {
    for (let column = 0; column < sortFields.length; column += 1) {
      const comparison = compareRawValues(raw[left][column], raw[right][column])
      if (comparison !== 0) return comparison
    }
    return left - right
  })
  const sortedRows = order.map((index) => rows[index])
  const mappedAt = (row: ReportRow, column: number) => {
    const field = fields[column]
    return getMappedValue(row, field.sourceKey, field.displayType, field.currencySymbol)
  }

  const output: TreeRow[] = []

  const pushDetailRows = (block: ReportRow[], level: number) => {
    for (const row of block) {
      output.push({
        kind: 'detail',
        key: `detail-${row.id}`,
        level,
        label: mappedAt(row, labelIndex),
        values: valueFields.map((field, offset) => ({
          value: mappedAt(row, labelIndex + 1 + offset),
          isNumeric: isNumericDisplayType(field.displayType),
        })),
      })
    }
  }

  const pushGroups = (block: ReportRow[], level: number, parentPath: string[]) => {
    if (level === groupCount) {
      pushDetailRows(block, level)
      return
    }

    let cursor = 0
    while (cursor < block.length) {
      const label = mappedAt(block[cursor], level)
      let end = cursor + 1
      while (end < block.length && mappedAt(block[end], level) === label) end += 1

      const groupRows = block.slice(cursor, end)
      const path = [...parentPath, label]
      const groupKey = getGroupKey(path)
      const isExpanded = isGroupExpanded(level, groupKey)
      // A collapsed group always shows its totals; otherwise the Totals toggle decides.
      const showGroupTotals = showTotals || !isExpanded
      output.push({
        kind: 'group',
        key: `group-${groupKey}`,
        level,
        label,
        groupKey,
        isExpanded,
        values: valueFields.map((field) => ({
          value: showGroupTotals ? formatFieldTotal(groupRows, field) : '',
          isNumeric: isNumericTotal(field),
        })),
      })
      if (isExpanded) pushGroups(groupRows, level + 1, path)
      cursor = end
    }
  }

  pushGroups(sortedRows, 0, [])
  return output
}

export type OutlineRowCounts = {
  // Rows shown at each Show rows level: byLevel[0] is one row per first-level
  // group, byLevel[1] adds the second level's groups, and so on.
  byLevel: number[]
  // Rows shown fully expanded: every group row plus every detail row.
  all: number
}

// How many rows each outline level would display, so a large report can open
// at the deepest level that stays readable.
export function countOutlineRows(
  rows: ReportRow[],
  fields: ReportField[],
  getMappedValue: GetMappedValue,
): OutlineRowCounts {
  const { groupCount } = getTreeLayout(fields)
  const groupsAtLevel = Array.from({ length: groupCount }, () => new Set<string>())
  for (const row of rows) {
    let path = ''
    for (let level = 0; level < groupCount; level += 1) {
      const field = fields[level]
      path += `\u0000${getMappedValue(row, field.sourceKey, field.displayType, field.currencySymbol)}`
      groupsAtLevel[level].add(path)
    }
  }

  const byLevel: number[] = []
  let shown = 0
  for (const groups of groupsAtLevel) {
    shown += groups.size
    byLevel.push(shown)
  }
  return { byLevel, all: shown + rows.length }
}

// The outline level to actually open at: the requested one when it fits under
// maxVisibleRows, otherwise the deepest level that does (the first level when
// nothing fits). null means fully expanded.
export function getEffectiveExpandedLevels(
  requested: number | null,
  counts: OutlineRowCounts,
  maxVisibleRows: number,
): number | null {
  const groupCount = counts.byLevel.length
  const normalized = requested === null || requested >= groupCount ? null : requested
  const rowsAt = (level: number | null) => (level === null ? counts.all : counts.byLevel[level])
  if (groupCount === 0 || rowsAt(normalized) <= maxVisibleRows) return normalized

  for (let level = (normalized ?? groupCount) - 1; level > 0; level -= 1) {
    if (rowsAt(level) <= maxVisibleRows) return level
  }
  return 0
}
