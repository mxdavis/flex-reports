import type { ReportRow } from '../../../../services/adapters'
import type { DisplayType, ReportField } from '../../../../services/reportDefinition/types'
import type { AggregateMode } from '../../types'
import { buildPivotRenderRows } from './sampleRowsPivot'

type SampleRowsHorizontalTableContentProps = {
  showTotals: boolean
  aggregateMode: AggregateMode
  isGroupingEnabled: boolean
  fields: ReportField[]
  previewRows: ReportRow[]
  getMappedValue: (row: ReportRow, sourceKey: string, displayType: DisplayType, currencySymbol?: string) => string
  getAggregatedFieldValue: (rowsToAggregate: ReportRow[], sourceKey: string, mode: AggregateMode) => number | null
  formatValue: (value: number | null, displayType: DisplayType, currencySymbol?: string) => string
  isNumericDisplayType: (displayType: DisplayType) => boolean
}

export function SampleRowsHorizontalTableContent({
  showTotals,
  aggregateMode,
  isGroupingEnabled,
  fields,
  previewRows,
  getMappedValue,
  getAggregatedFieldValue,
  formatValue,
  isNumericDisplayType,
}: SampleRowsHorizontalTableContentProps) {
  const aggregateSummaryLabel = aggregateMode === 'avg'
    ? 'Average'
    : aggregateMode === 'count'
      ? 'Count'
      : aggregateMode === 'distinct'
        ? 'DISTINCT COUNT'
      : 'Total'

  const getAggregateDisplayType = (field: ReportField): DisplayType => {
    return (aggregateMode === 'count' || aggregateMode === 'distinct') ? 'number' : field.displayType
  }

  // Total row: first column carries the group label (with the plain row count
  // shown once for count mode); the remaining columns show the per-column
  // aggregate (distinct count / sum / average).
  const renderTotalCells = (rowsForTotals: ReportRow[]) =>
    fields.slice(1).map((field) => (
      <td
        key={`total-${field.id}`}
        className={aggregateMode === 'count' || aggregateMode === 'distinct' || isNumericDisplayType(field.displayType) ? 'seed-table-value-numeric' : ''}
      >
        {aggregateMode === 'count'
          ? ''
          : <strong>{formatValue(
            getAggregatedFieldValue(rowsForTotals, field.sourceKey, aggregateMode),
            getAggregateDisplayType(field),
            field.currencySymbol,
          )}</strong>}
      </td>
    ))

  const shouldRenderEmbeddedPivot = isGroupingEnabled && fields.length >= 2
  if (shouldRenderEmbeddedPivot) {
    const pivotRows = buildPivotRenderRows({
      previewRows,
      fields,
      aggregateMode,
      showTotals,
      getMappedValue,
      getAggregatedFieldValue,
      formatValue,
      isNumericDisplayType,
    })

    return (
      <>
        <thead>
          <tr>
            {fields.map((field) => {
              return <th key={field.id}>{field.label}</th>
            })}
          </tr>
        </thead>
        <tbody>
          {pivotRows.map((pivotRow) => (
            <tr key={pivotRow.key}>
              {pivotRow.cells.map((cell) => {
                const className = cell.isNumeric ? 'seed-table-value-numeric' : undefined
                const content = cell.emphasis ? <strong>{cell.value}</strong> : cell.value
                if (cell.tag === 'th') {
                  return (
                    <th
                      key={`${pivotRow.key}-${cell.columnIndex}`}
                      scope={cell.scope}
                      rowSpan={cell.rowSpan}
                      className={className}
                    >
                      {content}
                    </th>
                  )
                }
                return (
                  <td
                    key={`${pivotRow.key}-${cell.columnIndex}`}
                    rowSpan={cell.rowSpan}
                    className={className}
                  >
                    {content}
                  </td>
                )
              })}
            </tr>
          ))}
        </tbody>
        {showTotals && (
          <tfoot>
            <tr>
              <th scope="row">
                <strong>
                  {aggregateMode === 'count' ? `Grand Count Total ${previewRows.length}` : 'Grand total'}
                </strong>
              </th>
              {renderTotalCells(previewRows)}
            </tr>
          </tfoot>
        )}
      </>
    )
  }

  return (
    <>
      <thead>
        <tr>
          {fields.map((field) => {
            return <th key={field.id}>{field.label}</th>
          })}
        </tr>
      </thead>
      <tbody>
        {previewRows.map((row) => (
          <tr key={row.id}>
            {fields.map((field) => {
              const mappedValue = getMappedValue(
                row,
                field.sourceKey,
                field.displayType,
                field.currencySymbol,
              )
              return (
                <td
                  key={`${row.id}-${field.id}`}
                  className={isNumericDisplayType(field.displayType) ? 'seed-table-value-numeric' : ''}
                >
                  {mappedValue}
                </td>
              )
            })}
          </tr>
        ))}
      </tbody>
      {showTotals && fields.length > 0 && (
        <tfoot>
          <tr>
            {fields.map((field, index) => {
              if (index === 0) {
                return (
                  <th key={`total-label-${field.id}`}>
                    <strong>
                      {aggregateMode === 'count' ? `Count Total ${previewRows.length}` : aggregateSummaryLabel}
                    </strong>
                  </th>
                )
              }

              const aggregatedValue = getAggregatedFieldValue(
                previewRows,
                field.sourceKey,
                aggregateMode,
              )
              return (
                <td
                  key={`total-value-${field.id}`}
                  className={aggregateMode === 'count' || aggregateMode === 'distinct' || isNumericDisplayType(field.displayType) ? 'seed-table-value-numeric' : ''}
                >
                  {aggregateMode === 'count'
                    ? ''
                    : <strong>{formatValue(
                      aggregatedValue,
                      getAggregateDisplayType(field),
                      field.currencySymbol,
                    )}</strong>}
                </td>
              )
            })}
          </tr>
        </tfoot>
      )}
    </>
  )
}
