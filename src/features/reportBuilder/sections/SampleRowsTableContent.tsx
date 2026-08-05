import type { ReportRow } from '../../../services/adapters'
import type { DisplayType, ReportField } from '../../../services/reportDefinition/types'
import type { AggregateMode } from '../types'
import './SampleRowsTableContent.css'

type VerticalColumn = {
  key: string
  headerValue: string
  rows: ReportRow[]
}

type SampleRowsTableContentProps = {
  isHorizontalTable: boolean
  showTotals: boolean
  aggregateMode: AggregateMode
  fields: ReportField[]
  previewRows: ReportRow[]
  verticalColumns: VerticalColumn[]
  getMappedValue: (row: ReportRow, sourceKey: string, displayType: DisplayType, currencySymbol?: string) => string
  getAggregatedFieldValue: (rowsToAggregate: ReportRow[], sourceKey: string, mode: AggregateMode) => number | null
  formatValue: (value: number | null, displayType: DisplayType, currencySymbol?: string) => string
}

function isNumericDisplayType(displayType: DisplayType): boolean {
  return displayType === 'number' || displayType === 'decimal' || displayType === 'currency'
}

function SampleRowsTableContent({
  isHorizontalTable,
  showTotals,
  aggregateMode,
  fields,
  previewRows,
  verticalColumns,
  getMappedValue,
  getAggregatedFieldValue,
  formatValue,
}: SampleRowsTableContentProps) {
  if (isHorizontalTable) {
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
                  return <th key={`total-label-${field.id}`}><strong>Total</strong></th>
                }

                const aggregatedValue = getAggregatedFieldValue(
                  previewRows,
                  field.sourceKey,
                  aggregateMode,
                )
                return (
                  <td
                    key={`total-value-${field.id}`}
                    className={isNumericDisplayType(field.displayType) ? 'seed-table-value-numeric' : ''}
                  >
                    <strong>{formatValue(aggregatedValue, field.displayType, field.currencySymbol)}</strong>
                  </td>
                )
              })}
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
          <th title="This column label and its values form the header row in vertical view.">
            {fields[0]?.label ?? 'Column 1'}
          </th>
          {verticalColumns.map((column) => {
            return <th key={`column-view-${column.key}`}>{column.headerValue}</th>
          })}
          {showTotals && <th>Total</th>}
        </tr>
      </thead>
      <tbody>
        {fields.slice(1).map((field) => (
          <tr key={`row-view-${field.id}`}>
            <th>{field.label}</th>
            {verticalColumns.map((column) => {
              const mappedValue = column.rows.length > 1
                ? (() => {
                  const aggregatedValue = getAggregatedFieldValue(
                    column.rows,
                    field.sourceKey,
                    aggregateMode,
                  )
                  if (aggregatedValue === null) {
                    return getMappedValue(
                      column.rows[0],
                      field.sourceKey,
                      field.displayType,
                      field.currencySymbol,
                    )
                  }

                  return formatValue(aggregatedValue, field.displayType, field.currencySymbol)
                })()
                : getMappedValue(
                  column.rows[0],
                  field.sourceKey,
                  field.displayType,
                  field.currencySymbol,
                )

              return (
                <td
                  key={`${field.id}-${column.key}`}
                  className={isNumericDisplayType(field.displayType) ? 'seed-table-value-numeric' : ''}
                >
                  {mappedValue}
                </td>
              )
            })}
            {showTotals && (
              <td className={isNumericDisplayType(field.displayType) ? 'seed-table-value-numeric' : ''}>
                <strong>
                  {formatValue(
                    getAggregatedFieldValue(
                      previewRows,
                      field.sourceKey,
                      aggregateMode,
                    ),
                    field.displayType,
                    field.currencySymbol,
                  )}
                </strong>
              </td>
            )}
          </tr>
        ))}
      </tbody>
    </>
  )
}

export default SampleRowsTableContent
