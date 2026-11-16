import { PrintModeContext } from '../../../shared/hooks/usePrintMode'
import { render, screen, within } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import type { ReportRow } from '../../../services/adapters'
import type { ReportField } from '../../../services/reportDefinition/types'
import { plainFieldValue, rawValue, simpleFieldTotal } from '../../../test/simpleFieldTotal'
import { HorizontalTableContent } from './HorizontalTableContent'

const fields: ReportField[] = [
  { id: 'region', label: 'Region', sourceKey: 'region', displayType: 'string', aggregation: 'none' },
  { id: 'store', label: 'Store', sourceKey: 'store', displayType: 'string', aggregation: 'none' },
  { id: 'units', label: 'Units', sourceKey: 'units', displayType: 'number', aggregation: 'sum' },
]

function makeRows(count: number): ReportRow[] {
  return Array.from({ length: count }, (_, index) => ({ id: `r${index}`, region: index % 2 ? 'North' : 'South', store: `Store ${index}`, units: 1 }))
}

function renderTable(isGrouped: boolean, rows: ReportRow[] = makeRows(3), isPrinting = false, isExpanded = true) {
  return render(
    <PrintModeContext.Provider value={isPrinting}>
    <table>
      <HorizontalTableContent
        showTotals
        isGrouped={isGrouped}
        fields={fields}
        rows={rows}
        scrollContainerRef={{ current: null }}
        getFieldValue={plainFieldValue}
        getRawValue={rawValue}
        formatFieldTotal={simpleFieldTotal}
        getFieldWarning={() => null}
        isGroupExpanded={() => isExpanded}
        onToggleGroup={() => undefined}
      />
    </table>
    </PrintModeContext.Provider>,
  )
}

describe('HorizontalTableContent', () => {
  it('renders one body row per data row with a total footer when not grouped', () => {
    const { container } = renderTable(false)

    expect(container.querySelectorAll('tbody tr')).toHaveLength(3)
    expect(within(container.querySelector('tfoot')!).getByText('3')).toBeInTheDocument()
  })

  it('renders each group once as a toggle row carrying its total', () => {
    renderTable(true)

    expect(screen.getAllByText('North')).toHaveLength(1)
    expect(screen.getByRole('button', { name: 'North' })).toHaveAttribute('aria-expanded', 'true')
    expect(screen.getByText('Grand total')).toBeInTheDocument()
  })

  it('draws only the rows near the viewport for large reports', () => {
    const { container } = renderTable(false, makeRows(5000))

    const drawnRows = container.querySelectorAll('tbody tr:not(.fr-spacer-row)')
    expect(drawnRows.length).toBeGreaterThan(0)
    expect(drawnRows.length).toBeLessThan(100)
    expect(container.querySelector('tbody .fr-spacer-row')).toBeInTheDocument()
    // Totals still cover every row, not just the drawn ones.
    expect(within(container.querySelector('tfoot')!).getByText('5000')).toBeInTheDocument()
  })
})

it('prints at most 1,000 detail rows while totalling the full dataset', () => {
  const { container } = renderTable(false, makeRows(1500), true)
  expect(container.querySelectorAll('tbody tr')).toHaveLength(1000)
  expect(screen.queryByText('Store 1000')).toBeNull()
  expect(within(container.querySelector('tfoot')!).getByText('1500')).toBeInTheDocument()
  expect(screen.getByText(/Calculations and totals use all 1,500 source rows/)).toBeInTheDocument()
})

it('groups all source rows before applying the display and print limit', () => {
  const { container } = renderTable(true, makeRows(1500), true, false)
  expect(container.querySelectorAll('tbody tr')).toHaveLength(2)
  expect(within(container.querySelector('tbody')!).getAllByText('750')).toHaveLength(2)
  expect(within(container.querySelector('tfoot')!).getByText('1500')).toBeInTheDocument()
})

it('caps manually expanded groups when printing without changing their totals', () => {
  const { container } = renderTable(true, makeRows(1500), true)
  expect(container.querySelectorAll('tbody tr')).toHaveLength(1000)
  expect(within(container.querySelector('tfoot')!).getByText('1500')).toBeInTheDocument()
})
