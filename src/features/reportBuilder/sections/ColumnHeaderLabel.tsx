import type { ReportField } from '../../../services/reportDefinition/types'
import './ColumnHeaderLabel.css'

type ColumnHeaderLabelProps = {
  field: ReportField
  warning: string | null
}

// A column header, flagged when the column's source is missing.
function ColumnHeaderLabel({ field, warning }: ColumnHeaderLabelProps) {
  if (!warning) return <th>{field.label}</th>

  return (
    <th className="fr-column-header-warning" title={warning}>
      {field.label}{' '}
      <span className="fr-column-header-warning-icon" aria-hidden="true">⚠</span>
      <span className="fr-column-header-warning-text">(missing source)</span>
    </th>
  )
}

export default ColumnHeaderLabel
