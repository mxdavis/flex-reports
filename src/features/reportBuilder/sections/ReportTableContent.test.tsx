import { fireEvent, render, screen, within } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import type { ReportRow } from '../../../services/adapters'
import type { ReportField } from '../../../services/reportDefinition/types'
import { plainMappedValue, rawValue, simpleFieldTotal } from '../../../test/simpleFieldTotal'
import { getGroupKey } from '../report/model/pivotLayout'
import ReportTableContent, { type ReportTableContentProps } from './ReportTableContent'

function field(id: string, label: string, aggregation: ReportField['aggregation'], displayType: ReportField['displayType'] = 'number'): ReportField {
  return { id, label, sourceKey: id, displayType, aggregation, currencySymbol: '' }
}

// Deliberately not billing data: the table must work for any shape.
const groupedFields: ReportField[] = [
  field('region', 'Region', 'distinct', 'string'),
  field('store', 'Store', 'count', 'string'),
  field('price', 'Price', 'avg'),
  field('units', 'Units', 'sum'),
]

const groupedRows: ReportRow[] = [
  { id: 'n1', region: 'North', store: 'Ames', price: 10, units: 2 },
  { id: 'n2', region: 'North', store: 'Ames', price: 20, units: 3 },
  { id: 'n3', region: 'North', store: 'Boone', price: 30, units: 5 },
  { id: 's1', region: 'South', store: 'Cary', price: 40, units: 4 },
]

function renderTable(overrides: Partial<ReportTableContentProps> = {}) {
  const props: ReportTableContentProps = {
    isHorizontalTable: true,
    showTotals: true,
    isGroupingEnabled: true,
    fields: groupedFields,
    rows: groupedRows,
    verticalColumns: [],
    getMappedValue: plainMappedValue,
    getRawValue: rawValue,
    formatFieldTotal: simpleFieldTotal,
    getFieldWarning: () => null,
    isGroupExpanded: () => true,
    onToggleGroup: () => undefined,
    ...overrides,
  }
  return render(<table><ReportTableContent {...props} /></table>)
}

function rowCells(rowHeaderName: string): string[] {
  const row = screen.getByRole('rowheader', { name: rowHeaderName }).closest('tr')!
  return Array.from(row.querySelectorAll('td')).map((cell) => cell.textContent ?? '')
}

describe('ReportTableContent', () => {
  it('renders plain rows with a Total footer when grouping is off', () => {
    renderTable({ isGroupingEnabled: false })

    expect(screen.getByRole('columnheader', { name: 'Region' })).toBeInTheDocument()
    expect(screen.getAllByRole('cell', { name: 'North' })).toHaveLength(3)
    expect(rowCells('Total')).toEqual(['4', '25', '14'])
  })

  it('gives every group a total row, including single-row groups', () => {
    renderTable()

    expect(screen.getByRole('rowheader', { name: 'North Total' })).toBeInTheDocument()
    expect(screen.getByRole('rowheader', { name: 'South Total' })).toBeInTheDocument()
    expect(screen.getByRole('rowheader', { name: 'Ames Total' })).toBeInTheDocument()
    expect(screen.getByRole('rowheader', { name: 'Boone Total' })).toBeInTheDocument()
    expect(screen.getByRole('rowheader', { name: 'Grand total' })).toBeInTheDocument()
  })

  it('totals each column by its own aggregation', () => {
    renderTable()

    // Store counts rows, Price averages, Units sums.
    expect(rowCells('North Total')).toEqual(['3', '20', '10'])
    expect(rowCells('Grand total')).toEqual(['4', '25', '14'])
  })

  it('leaves a column blank in totals when its aggregation is none', () => {
    renderTable({ fields: [groupedFields[0], groupedFields[1], field('price', 'Price', 'none'), groupedFields[3]] })

    expect(rowCells('North Total')).toEqual(['3', '', '10'])
  })

  it('omits total rows when totals are off', () => {
    renderTable({ showTotals: false })

    expect(screen.queryByRole('rowheader', { name: 'North Total' })).toBeNull()
    expect(screen.queryByRole('rowheader', { name: 'Grand total' })).toBeNull()
  })

  it('renders a collapsed group as one row with its totals', () => {
    const northKey = getGroupKey(['North'])
    renderTable({ isGroupExpanded: (_level, groupKey) => groupKey !== northKey })

    const northButton = screen.getByRole('button', { name: 'North' })
    expect(northButton).toHaveAttribute('aria-expanded', 'false')
    expect(screen.queryByText('Ames')).toBeNull()
    expect(screen.queryByRole('rowheader', { name: 'North Total' })).toBeNull()
    expect(rowCells('North')).toEqual(['3', '20', '10'])
    expect(screen.getByRole('button', { name: 'South' })).toHaveAttribute('aria-expanded', 'true')
  })

  it('keeps nested groups distinct by their full path', () => {
    const amesKey = getGroupKey(['North', 'Ames'])
    renderTable({ isGroupExpanded: (_level, groupKey) => groupKey !== amesKey })

    expect(screen.getByRole('button', { name: 'Ames' })).toHaveAttribute('aria-expanded', 'false')
    expect(screen.getByRole('button', { name: 'Boone' })).toHaveAttribute('aria-expanded', 'true')
    expect(screen.queryByRole('rowheader', { name: 'Ames Total' })).toBeNull()
  })

  it('reports the group and its next state when a group is toggled', () => {
    const onToggleGroup = vi.fn()
    renderTable({ onToggleGroup })

    fireEvent.click(screen.getByRole('button', { name: 'North' }))

    expect(onToggleGroup).toHaveBeenCalledWith(getGroupKey(['North']), false)
  })

  it('renders vertical rows with a per-column Total column', () => {
    const verticalFields = [field('store', 'Store', 'count', 'string'), field('units', 'Units', 'sum')]
    renderTable({
      isHorizontalTable: false,
      fields: verticalFields,
      verticalColumns: groupedRows.map((row) => ({ key: row.id, headerValue: String(row.store), rows: [row] })),
    })

    expect(screen.getAllByRole('columnheader', { name: 'Ames' })).toHaveLength(2)
    const unitsRow = screen.getByText('Units').closest('tr')!
    expect(within(unitsRow).getByText('14')).toBeInTheDocument()
  })
})
