import type { ReportRow } from '../../../../services/adapters'
import type { DisplayType, ReportField } from '../../../../services/reportDefinition/types'
import type { AggregateMode } from '../../types'

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
}

export type PivotRenderRow = {
  key: string
  cells: PivotCell[]
}

type GetMappedValue = (
  row: ReportRow,
  sourceKey: string,
  displayType: DisplayType,
  currencySymbol?: string,
) => string

type GetAggregatedFieldValue = (
  rowsToAggregate: ReportRow[],
  sourceKey: string,
  mode: AggregateMode,
) => number | null

type FormatValue = (value: number | null, displayType: DisplayType, currencySymbol?: string) => string

type BuildPivotRenderRowsArgs = {
  previewRows: ReportRow[]
  fields: ReportField[]
  aggregateMode: AggregateMode
  showTotals: boolean
  getMappedValue: GetMappedValue
  getAggregatedFieldValue: GetAggregatedFieldValue
  formatValue: FormatValue
  isNumericDisplayType: (displayType: DisplayType) => boolean
}

// Grouping rule: the leftmost columns nest left-to-right. Every column except
// the last acts as a grouping level; the last column holds the leaf detail
// value. A subtotal row is emitted whenever a grouping level closes, so the
// aggregate (sum / avg / count / distinct count) is shown for every subgroup —
// not just the top-level group. Grouping-value cells use rowSpan so repeated
// parent values render once, spreadsheet-style, and their span covers nested
// subtotal rows but stops before the level's own subtotal row.
export function buildPivotRenderRows({
  previewRows,
  fields,
  aggregateMode,
  showTotals,
  getMappedValue,
  getAggregatedFieldValue,
  formatValue,
  isNumericDisplayType,
}: BuildPivotRenderRowsArgs): PivotRenderRow[] {
  if (fields.length < 2 || previewRows.length === 0) return []

  const lastGroupLevel = fields.length - 2
  const leafColumn = fields.length - 1

  const mapped = previewRows.map((row) =>
    fields.map((field) => getMappedValue(row, field.sourceKey, field.displayType, field.currencySymbol)),
  )

  const order = previewRows.map((_, index) => index).sort((left, right) => {
    for (let column = 0; column < fields.length; column += 1) {
      if (mapped[left][column] < mapped[right][column]) return -1
      if (mapped[left][column] > mapped[right][column]) return 1
    }
    return 0
  })

  const sortedRows = order.map((index) => previewRows[index])
  const sortedMapped = order.map((index) => mapped[index])

  const aggregateSummaryLabel = aggregateMode === 'avg' ? 'Average' : 'Total'
  const aggregateDisplayType = (field: ReportField): DisplayType => {
    return aggregateMode === 'count' || aggregateMode === 'distinct' ? 'number' : field.displayType
  }

  const buildSubtotalLabel = (value: string, rowCount: number): string => {
    if (aggregateMode === 'count') return `${value} Count Total ${rowCount}`
    if (aggregateMode === 'distinct') return `${value} DISTINCT COUNT`
    return `${value} ${aggregateSummaryLabel}`
  }

  const buildSubtotalRow = (level: number, value: string, indices: number[]): PivotRenderRow => {
    const blockRows = indices.map((index) => sortedRows[index])
    const cells: PivotCell[] = [{
      columnIndex: level,
      tag: 'th',
      scope: 'row',
      value: buildSubtotalLabel(value, indices.length),
      rowSpan: 1,
      isNumeric: false,
      emphasis: true,
    }]

    for (let column = level + 1; column < fields.length; column += 1) {
      const field = fields[column]
      const isNumeric = aggregateMode === 'count'
        || aggregateMode === 'distinct'
        || isNumericDisplayType(field.displayType)
      const cellValue = aggregateMode === 'count'
        ? ''
        : formatValue(
          getAggregatedFieldValue(blockRows, field.sourceKey, aggregateMode),
          aggregateDisplayType(field),
          field.currencySymbol,
        )
      cells.push({ columnIndex: column, tag: 'td', value: cellValue, rowSpan: 1, isNumeric, emphasis: true })
    }

    return { key: `subtotal-${level}-${indices[0]}-${value}`, cells }
  }

  const buildLeafRows = (indices: number[]): PivotRenderRow[] => {
    const rows: PivotRenderRow[] = []
    const isNumeric = isNumericDisplayType(fields[leafColumn].displayType)
    let cursor = 0
    while (cursor < indices.length) {
      const value = sortedMapped[indices[cursor]][leafColumn]
      let span = 1
      while (
        cursor + span < indices.length
        && sortedMapped[indices[cursor + span]][leafColumn] === value
      ) {
        span += 1
      }

      rows.push({
        key: `leaf-${sortedRows[indices[cursor]].id}`,
        cells: [{ columnIndex: leafColumn, tag: 'td', value, rowSpan: span, isNumeric, emphasis: false }],
      })
      for (let offset = 1; offset < span; offset += 1) {
        rows.push({ key: `leaf-${sortedRows[indices[cursor + offset]].id}`, cells: [] })
      }
      cursor += span
    }
    return rows
  }

  const process = (indices: number[], level: number): PivotRenderRow[] => {
    if (level > lastGroupLevel) {
      return buildLeafRows(indices)
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
      const childRows = process(blockIndices, level + 1)

      const groupCell: PivotCell = {
        columnIndex: level,
        tag: level === 0 ? 'th' : 'td',
        scope: level === 0 ? 'rowgroup' : undefined,
        value,
        rowSpan: childRows.length,
        isNumeric: isNumericDisplayType(fields[level].displayType),
        emphasis: false,
      }
      childRows[0] = { ...childRows[0], cells: [groupCell, ...childRows[0].cells] }
      output.push(...childRows)

      if (showTotals && (level === 0 || count > 1)) {
        output.push(buildSubtotalRow(level, value, blockIndices))
      }

      cursor += count
    }
    return output
  }

  return process(sortedRows.map((_, index) => index), 0)
}
