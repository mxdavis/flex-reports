import { memo } from 'react'
import type { VerticalColumn } from '../report/model/useReportBuilderComputed'
import { isNumericDisplayType } from '../report/model/fieldTotals'
import {
  HorizontalTableContent,
  type HorizontalTableContentProps,
} from './HorizontalTableContent'
import ColumnHeaderLabel from './ColumnHeaderLabel'
import './ReportTableContent.css'


export type ReportTableContentProps = HorizontalTableContentProps & {
  isHorizontalTable: boolean
  verticalColumns: VerticalColumn[]
}

function ReportTableContent({ isHorizontalTable, verticalColumns, ...tableProps }: ReportTableContentProps) {
  if (isHorizontalTable) {
    return <HorizontalTableContent {...tableProps} />
  }

  // Vertical view has no totals: it's for reading a few rows side by side.
  const { fields, getFieldValue, getFieldWarning } = tableProps

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
        </tr>
      </thead>
      <tbody>
        {fields.slice(1).map((field) => (
          <tr key={`row-view-${field.id}`}>
            <ColumnHeaderLabel field={field} warning={getFieldWarning(field)} />
            {verticalColumns.map((column) => (
              <td
                key={`${field.id}-${column.key}`}
                className={isNumericDisplayType(field.displayType) ? 'fr-numeric-cell' : undefined}
              >
                {getFieldValue(column.row, field)}
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </>
  )
}

// Memoized: the table is the expensive part of the page, and its props only
// change when the data or the table view does (not while typing in edit mode).
export default memo(ReportTableContent)
