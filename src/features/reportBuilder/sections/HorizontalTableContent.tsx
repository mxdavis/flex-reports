import { useMemo, type RefObject } from 'react'
import type { ReportRow } from '../../../services/adapters'
import type { DisplayType, ReportField } from '../../../services/reportDefinition/types'
import { isNumericDisplayType, isNumericTotal } from '../report/model/fieldTotals'
import { buildTreeRows, getTreeLayout } from '../report/model/pivotLayout'
import ColumnHeaderLabel from './ColumnHeaderLabel'
import TreeTableRow from './TreeTableRow'
import VirtualTableBody from './VirtualTableBody'
import './HorizontalTableContent.css'

export type HorizontalTableContentProps = {
  showTotals: boolean
  isGroupingEnabled: boolean
  fields: ReportField[]
  rows: ReportRow[]
  scrollContainerRef: RefObject<HTMLDivElement | null>
  getMappedValue: (row: ReportRow, sourceKey: string, displayType: DisplayType, currencySymbol?: string) => string
  getRawValue: (row: ReportRow, sourceKey: string) => unknown
  formatFieldTotal: (rows: ReportRow[], field: ReportField) => string
  getFieldWarning: (field: ReportField) => string | null
  isGroupExpanded: (level: number, groupKey: string) => boolean
  onToggleGroup: (groupKey: string, isExpanded: boolean) => void
}

export function HorizontalTableContent({
  showTotals,
  isGroupingEnabled,
  fields,
  rows,
  scrollContainerRef,
  getMappedValue,
  getRawValue,
  formatFieldTotal,
  getFieldWarning,
  isGroupExpanded,
  onToggleGroup,
}: HorizontalTableContentProps) {
  const layout = getTreeLayout(fields)
  const isGrouped = isGroupingEnabled && layout.groupCount > 0

  const treeRows = useMemo(() => (isGrouped
    ? buildTreeRows({ rows, fields, showTotals, getMappedValue, getRawValue, formatFieldTotal, isGroupExpanded })
    : []), [fields, formatFieldTotal, getMappedValue, getRawValue, isGroupExpanded, isGrouped, rows, showTotals])

  // Grouped: one label column (the group columns plus the row label, nested),
  // then the value columns. Ungrouped: every column as-is.
  const labelFields = isGrouped ? fields.slice(0, layout.labelIndex + 1) : fields.slice(0, 1)
  const valueFields = fields.slice(labelFields.length)
  const labelWarnings = labelFields.map(getFieldWarning).filter(Boolean)
  const labelHeaderField = { ...labelFields[0], label: labelFields.map((field) => field.label).join(' › ') }

  const header = (
    <thead>
      <tr>
        {isGrouped
          ? <ColumnHeaderLabel field={labelHeaderField} warning={labelWarnings.join(' ') || null} />
          : fields.map((field) => <ColumnHeaderLabel key={field.id} field={field} warning={getFieldWarning(field)} />)}
        {isGrouped && valueFields.map((field) => <ColumnHeaderLabel key={field.id} field={field} warning={getFieldWarning(field)} />)}
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
              {getMappedValue(rows[index], field.sourceKey, field.displayType, field.currencySymbol)}
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
