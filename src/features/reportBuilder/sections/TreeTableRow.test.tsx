import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import type { TreeRow } from '../report/model/pivotLayout'
import TreeTableRow from './TreeTableRow'

const groupRow: TreeRow = {
  kind: 'group',
  key: 'group-north',
  level: 1,
  label: 'North',
  groupKey: 'north',
  isExpanded: false,
  values: [{ value: '10', isNumeric: true }],
}

function renderRow(row: TreeRow, onToggleGroup = vi.fn()) {
  render(<table><tbody><TreeTableRow row={row} onToggleGroup={onToggleGroup} /></tbody></table>)
  return onToggleGroup
}

describe('TreeTableRow', () => {
  it('renders a group as a disclosure button that keeps the row name', () => {
    renderRow(groupRow)

    expect(screen.getByRole('rowheader', { name: 'North' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'North' })).toHaveAttribute('aria-expanded', 'false')
    expect(screen.getByRole('button', { name: 'North' })).toHaveAttribute('title', 'Expand North')
    expect(screen.getByRole('cell', { name: '10' })).toHaveClass('fr-numeric-cell')
  })

  it('asks to expand a collapsed group when clicked', () => {
    const onToggleGroup = renderRow(groupRow)

    fireEvent.click(screen.getByRole('button', { name: 'North' }))

    expect(onToggleGroup).toHaveBeenCalledWith('north', true)
  })

  it('renders a detail row as plain text, indented by its level', () => {
    renderRow({ kind: 'detail', key: 'detail-1', level: 2, label: 'Ames', values: [{ value: '3', isNumeric: true }] })

    const header = screen.getByRole('rowheader', { name: 'Ames' })
    expect(screen.queryByRole('button')).toBeNull()
    expect(header).toHaveStyle({ paddingLeft: '50px' })
    expect(header.closest('tr')).toHaveClass('fr-tree-row-detail')
  })
})
