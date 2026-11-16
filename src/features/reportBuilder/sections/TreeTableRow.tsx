import ChevronToggleIcon from '../../../shared/icons/ChevronToggleIcon'
import type { TreeRow } from '../report/model/pivotLayout'
import './TreeTableRow.css'

type TreeTableRowProps = {
  row: TreeRow
  measureRef?: (row: HTMLTableRowElement | null) => void
  onToggleGroup: (groupKey: string, isExpanded: boolean) => void
}

// One row of the grouped table: a group (with an expand/collapse button and its
// totals) or a detail row, indented by its nesting level.
function TreeTableRow({ row, measureRef, onToggleGroup }: TreeTableRowProps) {
  const indentStyle = { paddingLeft: `${10 + row.level * 20}px` }

  return (
    <tr ref={measureRef} className={`fr-tree-row fr-tree-row-${row.kind}`}>
      <th scope="row" style={indentStyle}>
        {row.kind === 'group' ? (
          // The group value itself is the disclosure button, so the cell keeps
          // the value as its accessible name.
          <button
            type="button"
            className="fr-tree-toggle"
            aria-expanded={row.isExpanded}
            title={`${row.isExpanded ? 'Collapse' : 'Expand'} ${row.label}`}
            onClick={() => onToggleGroup(row.groupKey, !row.isExpanded)}
          >
            <ChevronToggleIcon direction={row.isExpanded ? 'down' : 'right'} />
            <strong>{row.label}</strong>
          </button>
        ) : row.label}
      </th>
      {row.values.map((cell, index) => (
        <td key={index} className={cell.isNumeric ? 'fr-numeric-cell' : undefined}>
          {row.kind === 'group' ? <strong>{cell.value}</strong> : cell.value}
        </td>
      ))}
    </tr>
  )
}

export default TreeTableRow
