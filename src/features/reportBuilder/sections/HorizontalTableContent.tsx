import type { ReportRow } from '../../../services/adapters'
import type { DisplayType, ReportField } from '../../../services/reportDefinition/types'
import { isNumericDisplayType, isNumericTotal } from '../report/model/fieldTotals'
import { buildPivotRenderRows, getGroupLevelCount } from '../report/model/pivotLayout'
import ColumnHeaderLabel from './ColumnHeaderLabel'
import PivotTableBody from './PivotTableBody'
import './HorizontalTableContent.css'

export type HorizontalTableContentProps = {
  showTotals: boolean
  isGroupingEnabled: boolean
  fields: ReportField[]
  rows: ReportRow[]
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
  getMappedValue,
  getRawValue,
  formatFieldTotal,
  getFieldWarning,
  isGroupExpanded,
  onToggleGroup,
}: HorizontalTableContentProps) {
  const isGrouped = isGroupingEnabled && getGroupLevelCount(fields) > 0

  const header = (
    <thead>
      <tr>
        {fields.map((field) => <ColumnHeaderLabel key={field.id} field={field} warning={getFieldWarning(field)} />)}
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
        {fields.slice(1).map((field) => (
          <td key={`total-${field.id}`} className={isNumericTotal(field) ? 'fr-numeric-cell' : undefined}>
            <strong>{formatFieldTotal(rows, field)}</strong>
          </td>
        ))}
      </tr>
    </tfoot>
  )

  if (isGrouped) {
    const pivotRows = buildPivotRenderRows({
      rows,
      fields,
      showTotals,
      getMappedValue,
      getRawValue,
      formatFieldTotal,
      isGroupExpanded,
    })

    return (
      <>
        {header}
        <PivotTableBody pivotRows={pivotRows} onToggleGroup={onToggleGroup} />
        {footer}
      </>
    )
  }

  return (
    <>
      {header}
      <tbody>
        {rows.map((row) => (
          <tr key={row.id}>
            {fields.map((field) => (
              <td
                key={`${row.id}-${field.id}`}
                className={isNumericDisplayType(field.displayType) ? 'fr-numeric-cell' : undefined}
              >
                {getMappedValue(row, field.sourceKey, field.displayType, field.currencySymbol)}
              </td>
            ))}
          </tr>
        ))}
      </tbody>
      {footer}
    </>
  )
}
