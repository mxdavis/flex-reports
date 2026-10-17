import { fireEvent, render, screen, within } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import type { ReportRow } from '../../../services/adapters'
import type { ReportField } from '../../../services/reportDefinition/types'
import { plainFieldValue, rawValue, simpleFieldTotal } from '../../../test/simpleFieldTotal'
import { getGroupKey } from '../report/model/pivotLayout'
import ReportTableContent, { type ReportTableContentProps } from './ReportTableContent'

function field(id: string, label: string, aggregation: ReportField['aggregation'], displayType: ReportField['displayType'] = 'number'): ReportField {
  return { id, label, sourceKey: id, displayType, aggregation }
}

// Deliberately not billing data: the table must work for any shape.
// Region groups, Store names each row, Price and Units are values.
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
    isGrouped: true,
    fields: groupedFields,
    rows: groupedRows,
    verticalColumns: [],
    scrollContainerRef: { current: null },
    getFieldValue: plainFieldValue,
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
    renderTable({ isGrouped: false })

    expect(screen.getByRole('columnheader', { name: 'Region' })).toBeInTheDocument()
    expect(screen.getAllByRole('cell', { name: 'North' })).toHaveLength(3)
    expect(rowCells('Total')).toEqual(['4', '25', '14'])
  })

  it('nests groups into one label column, with the row-naming column under them', () => {
    renderTable()

    expect(screen.getByRole('columnheader', { name: 'Region › Store' })).toBeInTheDocument()
    expect(screen.queryByRole('columnheader', { name: 'Store' })).toBeNull()
    expect(screen.getAllByRole('rowheader', { name: 'Ames' })).toHaveLength(2)
    expect(rowCells('Boone')).toEqual(['30', '5'])
  })

  it('shows each group total on its own group row, using each column aggregation', () => {
    renderTable()

    // Price averages, Units sums.
    expect(rowCells('North')).toEqual(['20', '10'])
    expect(rowCells('South')).toEqual(['40', '4'])
    expect(rowCells('Grand total')).toEqual(['25', '14'])
  })

  it('leaves a column blank in totals when its aggregation is none', () => {
    renderTable({ fields: [groupedFields[0], groupedFields[1], field('price', 'Price', 'none'), groupedFields[3]] })

    expect(rowCells('North')).toEqual(['', '10'])
  })

  it('leaves expanded group totals and the grand total out when totals are off', () => {
    renderTable({ showTotals: false })

    expect(rowCells('North')).toEqual(['', ''])
    expect(screen.queryByRole('rowheader', { name: 'Grand total' })).toBeNull()
  })

  it('renders a collapsed group as one row with its totals', () => {
    const northKey = getGroupKey(['North'])
    renderTable({ showTotals: false, isGroupExpanded: (_level, groupKey) => groupKey !== northKey })

    expect(screen.getByRole('button', { name: 'North' })).toHaveAttribute('aria-expanded', 'false')
    expect(screen.queryByText('Ames')).toBeNull()
    expect(rowCells('North')).toEqual(['20', '10'])
    expect(screen.getByRole('button', { name: 'South' })).toHaveAttribute('aria-expanded', 'true')
  })

  it('reports the group and its next state when a group is toggled', () => {
    const onToggleGroup = vi.fn()
    renderTable({ onToggleGroup })

    fireEvent.click(screen.getByRole('button', { name: 'North' }))

    expect(onToggleGroup).toHaveBeenCalledWith(getGroupKey(['North']), false)
  })

  it('renders vertical rows without a Total column', () => {
    const verticalFields = [field('store', 'Store', 'count', 'string'), field('units', 'Units', 'sum')]
    renderTable({
      isHorizontalTable: false,
      fields: verticalFields,
      verticalColumns: groupedRows.map((row) => ({ key: row.id, headerValue: String(row.store), row })),
    })

    expect(screen.getAllByRole('columnheader', { name: 'Ames' })).toHaveLength(2)
    expect(screen.queryByRole('columnheader', { name: 'Total' })).toBeNull()
    const unitsRow = screen.getByText('Units').closest('tr')!
    expect(within(unitsRow).getAllByRole('cell').map((cell) => cell.textContent)).toEqual(['2', '3', '5', '4'])
  })
})
