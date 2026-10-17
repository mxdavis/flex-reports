import ChevronToggleIcon from '../../../shared/icons/ChevronToggleIcon'
import type { PivotCell, PivotRenderRow } from '../report/model/pivotLayout'
import './PivotTableBody.css'

type PivotTableBodyProps = {
  pivotRows: PivotRenderRow[]
  onToggleGroup: (groupKey: string, isExpanded: boolean) => void
}

function PivotCellContent({ cell, onToggleGroup }: { cell: PivotCell, onToggleGroup: PivotTableBodyProps['onToggleGroup'] }) {
  const text = cell.emphasis ? <strong>{cell.value}</strong> : cell.value
  if (!cell.toggle) return text

  // The group value itself is the disclosure button, so the cell keeps the
  // value as its accessible name.
  const { groupKey, isExpanded } = cell.toggle
  return (
    <button
      type="button"
      className="fr-pivot-group-toggle"
      aria-expanded={isExpanded}
      title={`${isExpanded ? 'Collapse' : 'Expand'} ${cell.value}`}
      onClick={() => onToggleGroup(groupKey, !isExpanded)}
    >
      <ChevronToggleIcon direction={isExpanded ? 'down' : 'right'} />
      {text}
    </button>
  )
}

function PivotTableBody({ pivotRows, onToggleGroup }: PivotTableBodyProps) {
  return (
    <tbody>
      {pivotRows.map((pivotRow) => (
        <tr key={pivotRow.key} className={`fr-pivot-row-${pivotRow.kind}`}>
          {pivotRow.cells.map((cell) => {
            const Tag = cell.tag
            return (
              <Tag
                key={`${pivotRow.key}-${cell.columnIndex}`}
                scope={cell.scope}
                rowSpan={cell.rowSpan}
                className={cell.isNumeric ? 'fr-numeric-cell' : undefined}
              >
                <PivotCellContent cell={cell} onToggleGroup={onToggleGroup} />
              </Tag>
            )
          })}
        </tr>
      ))}
    </tbody>
  )
}

export default PivotTableBody
