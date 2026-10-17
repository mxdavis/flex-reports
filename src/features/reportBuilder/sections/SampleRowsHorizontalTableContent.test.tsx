import { render, screen, within } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import type { ReportRow } from '../../../services/adapters'
import type { ReportField } from '../../../services/reportDefinition/types'
import { plainMappedValue, rawValue, simpleFieldTotal } from '../../../test/simpleFieldTotal'
import { SampleRowsHorizontalTableContent } from './SampleRowsHorizontalTableContent'

const fields: ReportField[] = [
  { id: 'region', label: 'Region', sourceKey: 'region', displayType: 'string', aggregation: 'none', currencySymbol: '' },
  { id: 'units', label: 'Units', sourceKey: 'units', displayType: 'number', aggregation: 'sum', currencySymbol: '' },
]

const rows: ReportRow[] = [
  { id: '1', region: 'North', units: 3 },
  { id: '2', region: 'North', units: 4 },
  { id: '3', region: 'South', units: 5 },
]

function renderTable(isGroupingEnabled: boolean) {
  return render(
    <table>
      <SampleRowsHorizontalTableContent
        showTotals
        isGroupingEnabled={isGroupingEnabled}
        fields={fields}
        previewRows={rows}
        getMappedValue={plainMappedValue}
        getRawValue={rawValue}
        formatFieldTotal={simpleFieldTotal}
        getFieldWarning={() => null}
        isGroupExpanded={() => true}
        onToggleGroup={() => undefined}
      />
    </table>,
  )
}

describe('SampleRowsHorizontalTableContent', () => {
  it('renders one body row per data row with a total footer when not grouped', () => {
    const { container } = renderTable(false)

    expect(container.querySelectorAll('tbody tr')).toHaveLength(3)
    expect(within(container.querySelector('tfoot')!).getByText('12')).toBeInTheDocument()
  })

  it('renders each group value once as a toggle, with a total row per group', () => {
    renderTable(true)

    expect(screen.getAllByText('North')).toHaveLength(1)
    expect(screen.getByRole('button', { name: 'North' })).toHaveAttribute('aria-expanded', 'true')
    expect(screen.getByText('North Total')).toBeInTheDocument()
    expect(screen.getByText('South Total')).toBeInTheDocument()
    expect(screen.getByText('7')).toBeInTheDocument()
    expect(screen.getByText('Grand total')).toBeInTheDocument()
  })
})
