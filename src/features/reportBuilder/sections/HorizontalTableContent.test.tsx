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

function renderTable(isGrouped: boolean, rows: ReportRow[] = makeRows(3)) {
  return render(
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
        isGroupExpanded={() => true}
        onToggleGroup={() => undefined}
      />
    </table>,
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
