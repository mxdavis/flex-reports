import type { ReportRow } from '../../../services/adapters'
import type { DisplayType, ReportField } from '../../../services/reportDefinition/types'
import type { AggregateMode } from '../types'
import { SampleRowsHorizontalTableContent } from '../report/model/SampleRowsHorizontalTableContent'
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
  isGroupingEnabled: boolean
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
  isGroupingEnabled,
  fields,
  previewRows,
  verticalColumns,
  getMappedValue,
  getAggregatedFieldValue,
  formatValue,
}: SampleRowsTableContentProps) {
  if (isHorizontalTable) {
    return (
      <SampleRowsHorizontalTableContent
        showTotals={showTotals}
        aggregateMode={aggregateMode}
        isGroupingEnabled={isGroupingEnabled}
        fields={fields}
        previewRows={previewRows}
        getMappedValue={getMappedValue}
        getAggregatedFieldValue={getAggregatedFieldValue}
        formatValue={formatValue}
        isNumericDisplayType={isNumericDisplayType}
      />
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

                  return formatValue(
                    aggregatedValue,
                    (aggregateMode === 'count' || aggregateMode === 'distinct') ? 'number' : field.displayType,
                    field.currencySymbol,
                  )
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
                    (aggregateMode === 'count' || aggregateMode === 'distinct') ? 'number' : field.displayType,
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
