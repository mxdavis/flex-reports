import type { ReportField } from '../../../services/reportDefinition/types'
import { isNumericDisplayType } from '../report/model/fieldTotals'
import './ColumnHeaderLabel.css'

type ColumnHeaderLabelProps = {
  field: ReportField
  warning: string | null
}

// A column header, flagged when the column's source is missing.
function ColumnHeaderLabel({ field, warning }: ColumnHeaderLabelProps) {
  const className = [
    isNumericDisplayType(field.displayType) && 'fr-numeric-cell',
    warning && 'fr-column-header-warning',
  ].filter(Boolean).join(' ') || undefined

  if (!warning) return <th className={className}>{field.label}</th>

  return (
    <th className={className} title={warning}>
      {field.label}{' '}
      <span className="fr-column-header-warning-icon" aria-hidden="true">⚠</span>
      <span className="fr-column-header-warning-text">(missing source)</span>
    </th>
  )
}

export default ColumnHeaderLabel
