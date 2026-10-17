import { useMemo, type RefObject } from 'react'
import type { ReportRow } from '../../../services/adapters'
import type { ReportField } from '../../../services/reportDefinition/types'
import { isNumericDisplayType, isNumericTotal } from '../report/model/fieldTotals'
import { buildTreeRows, getTreeLayout, joinFieldLabels, type GetFieldValue } from '../report/model/pivotLayout'
import ColumnHeaderLabel from './ColumnHeaderLabel'
import TreeTableRow from './TreeTableRow'
import VirtualTableBody from './VirtualTableBody'
import './HorizontalTableContent.css'

export type HorizontalTableContentProps = {
  showTotals: boolean
  // Grouping is on and there's at least one column to group by.
  isGrouped: boolean
  fields: ReportField[]
  rows: ReportRow[]
  scrollContainerRef: RefObject<HTMLDivElement | null>
  getFieldValue: GetFieldValue
  getRawValue: (row: ReportRow, sourceKey: string) => unknown
  formatFieldTotal: (rows: ReportRow[], field: ReportField) => string
  getFieldWarning: (field: ReportField) => string | null
  isGroupExpanded: (level: number, groupKey: string) => boolean
  onToggleGroup: (groupKey: string, isExpanded: boolean) => void
}

export function HorizontalTableContent({
  showTotals,
  isGrouped,
  fields,
  rows,
  scrollContainerRef,
  getFieldValue,
  getRawValue,
  formatFieldTotal,
  getFieldWarning,
  isGroupExpanded,
  onToggleGroup,
}: HorizontalTableContentProps) {
  const treeRows = useMemo(() => (isGrouped
    ? buildTreeRows({ rows, fields, showTotals, getFieldValue, getRawValue, formatFieldTotal, isGroupExpanded })
    : []), [fields, formatFieldTotal, getFieldValue, getRawValue, isGroupExpanded, isGrouped, rows, showTotals])

  // The first column is the label column: grouped, it nests the group columns
  // and the row-naming column under one header. Every other column is a value.
  const labelFields = isGrouped ? fields.slice(0, getTreeLayout(fields).labelIndex + 1) : fields.slice(0, 1)
  const valueFields = fields.slice(labelFields.length)
  const labelHeader = labelFields.length > 0 && (
    <ColumnHeaderLabel
      field={{ ...labelFields[0], label: joinFieldLabels(labelFields) }}
      warning={labelFields.map(getFieldWarning).filter(Boolean).join(' ') || null}
    />
  )

  const header = (
    <thead>
      <tr>
        {labelHeader}
        {valueFields.map((field) => <ColumnHeaderLabel key={field.id} field={field} warning={getFieldWarning(field)} />)}
      </tr>
    </thead>
  )

  // The first column carries the label; every other column shows its total
  // using its own aggregation setting.
  const footer = showTotals && fields.length > 0 && (
    <tfoot>
      <tr>
        <th scope="row">
          <strong>{isGrouped ? 'Grand total' : 'Total'}</strong>
        </th>
        {valueFields.map((field) => (
          <td key={`total-${field.id}`} className={isNumericTotal(field) ? 'fr-numeric-cell' : undefined}>
            <strong>{formatFieldTotal(rows, field)}</strong>
          </td>
        ))}
      </tr>
    </tfoot>
  )

  const body = isGrouped ? (
    <VirtualTableBody
      rowCount={treeRows.length}
      columnCount={valueFields.length + 1}
      scrollContainerRef={scrollContainerRef}
      renderRow={(index, measureRef) => (
        <TreeTableRow key={treeRows[index].key} row={treeRows[index]} measureRef={measureRef} onToggleGroup={onToggleGroup} />
      )}
    />
  ) : (
    <VirtualTableBody
      rowCount={rows.length}
      columnCount={fields.length}
      scrollContainerRef={scrollContainerRef}
      renderRow={(index, measureRef) => (
        <tr key={rows[index].id} ref={measureRef}>
          {fields.map((field) => (
            <td
              key={field.id}
              className={isNumericDisplayType(field.displayType) ? 'fr-numeric-cell' : undefined}
            >
              {getFieldValue(rows[index], field)}
            </td>
          ))}
        </tr>
      )}
    />
  )

  return (
    <>
      {header}
      {body}
      {footer}
    </>
  )
}
