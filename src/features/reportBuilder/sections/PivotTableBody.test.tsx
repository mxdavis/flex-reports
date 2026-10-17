import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import type { PivotRenderRow } from '../report/model/pivotLayout'
import PivotTableBody from './PivotTableBody'

const pivotRows: PivotRenderRow[] = [
  {
    key: 'collapsed-north',
    kind: 'collapsed',
    cells: [
      { columnIndex: 0, tag: 'th', scope: 'row', value: 'North', rowSpan: 1, isNumeric: false, emphasis: true, toggle: { groupKey: 'north', isExpanded: false } },
      { columnIndex: 1, tag: 'td', value: '10', rowSpan: 1, isNumeric: true, emphasis: true },
    ],
  },
]

function renderBody(onToggleGroup = vi.fn()) {
  render(<table><PivotTableBody pivotRows={pivotRows} onToggleGroup={onToggleGroup} /></table>)
  return onToggleGroup
}

describe('PivotTableBody', () => {
  it('renders the group value as a disclosure button that keeps the cell name', () => {
    renderBody()

    expect(screen.getByRole('rowheader', { name: 'North' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'North' })).toHaveAttribute('aria-expanded', 'false')
    expect(screen.getByRole('button', { name: 'North' })).toHaveAttribute('title', 'Expand North')
    expect(screen.getByRole('cell', { name: '10' })).toHaveClass('fr-numeric-cell')
  })

  it('asks to expand a collapsed group when clicked', () => {
    const onToggleGroup = renderBody()

    fireEvent.click(screen.getByRole('button', { name: 'North' }))

    expect(onToggleGroup).toHaveBeenCalledWith('north', true)
  })

  it('marks rows by kind for styling', () => {
    renderBody()

    expect(screen.getByRole('rowheader', { name: 'North' }).closest('tr')).toHaveClass('fr-pivot-row-collapsed')
  })
})
