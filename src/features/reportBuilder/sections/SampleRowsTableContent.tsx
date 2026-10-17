import type { ReportRow } from '../../../services/adapters'
import { isNumericDisplayType, isNumericTotal } from '../report/model/fieldTotals'
import {
  SampleRowsHorizontalTableContent,
  type SampleRowsHorizontalTableContentProps,
} from './SampleRowsHorizontalTableContent'
import './SampleRowsTableContent.css'

type VerticalColumn = {
  key: string
  headerValue: string
  rows: ReportRow[]
}

export type SampleRowsTableContentProps = SampleRowsHorizontalTableContentProps & {
  isHorizontalTable: boolean
  verticalColumns: VerticalColumn[]
}

function SampleRowsTableContent({ isHorizontalTable, verticalColumns, ...tableProps }: SampleRowsTableContentProps) {
  if (isHorizontalTable) {
    return <SampleRowsHorizontalTableContent {...tableProps} />
  }

  const { showTotals, fields, previewRows, getMappedValue, formatFieldTotal } = tableProps

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
            {verticalColumns.map((column) => (
              <td
                key={`${field.id}-${column.key}`}
                className={isNumericDisplayType(field.displayType) ? 'seed-table-value-numeric' : ''}
              >
                {getMappedValue(column.rows[0], field.sourceKey, field.displayType, field.currencySymbol)}
              </td>
            ))}
            {showTotals && (
              <td className={isNumericTotal(field) ? 'seed-table-value-numeric' : ''}>
                <strong>{formatFieldTotal(previewRows, field)}</strong>
              </td>
            )}
          </tr>
        ))}
      </tbody>
    </>
  )
}

export default SampleRowsTableContent
