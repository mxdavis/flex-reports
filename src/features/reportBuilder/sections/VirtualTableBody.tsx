import { useContext, type ReactNode, type RefObject } from 'react'
import { PrintModeContext } from '../../../shared/hooks/usePrintMode'
import { useVisibleRange } from '../../../shared/hooks/useVisibleRange'
import './VirtualTableBody.css'

type VirtualTableBodyProps = {
  rowCount: number
  columnCount: number
  scrollContainerRef: RefObject<HTMLElement | null>
  // Renders row `index`; pass `measureRef` to the row's <tr> when given.
  renderRow: (index: number, measureRef?: (row: HTMLTableRowElement | null) => void) => ReactNode
}

// Draws only the rows inside the scroll container's viewport. Spacer rows keep
// the scrollbar sized for the full table. While printing, every row is drawn.
function VirtualTableBody({ rowCount, columnCount, scrollContainerRef, renderRow }: VirtualTableBodyProps) {
  const isPrinting = useContext(PrintModeContext)
  const visible = useVisibleRange(scrollContainerRef, rowCount)
  const { start, end, paddingTop, paddingBottom, measureRow } = isPrinting
    ? { ...visible, start: 0, end: rowCount, paddingTop: 0, paddingBottom: 0 }
    : visible

  const rows: ReactNode[] = []
  for (let index = start; index < end; index += 1) {
    rows.push(renderRow(index, index === start ? measureRow : undefined))
  }

  const spacer = (height: number) => height > 0 && (
    <tr className="fr-spacer-row" aria-hidden="true" style={{ height }}>
      <td colSpan={columnCount} />
    </tr>
  )

  return (
    <tbody>
      {spacer(paddingTop)}
      {rows}
      {spacer(paddingBottom)}
    </tbody>
  )
}

export default VirtualTableBody
