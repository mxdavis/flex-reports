import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import type { ReportRow } from '../../../services/adapters'
import type { ReportField } from '../../../services/reportDefinition/types'
import { plainMappedValue, rawValue, simpleFieldTotal } from '../../../test/simpleFieldTotal'
import SampleRowsSection, { type SampleRowsSectionProps } from './SampleRowsSection'

const fields: ReportField[] = [
  { id: 'region', label: 'Region', sourceKey: 'region', displayType: 'string', aggregation: 'distinct', currencySymbol: '' },
  { id: 'store', label: 'Store', sourceKey: 'store', displayType: 'string', aggregation: 'count', currencySymbol: '' },
  { id: 'units', label: 'Units', sourceKey: 'units', displayType: 'number', aggregation: 'sum', currencySymbol: '' },
]

const rows: ReportRow[] = [{ id: 'row1', region: 'North', store: 'Ames', units: 3 }]

function renderSection(overrides: Partial<SampleRowsSectionProps> = {}) {
  const props: SampleRowsSectionProps = {
    sheetName: 'Finance Sheet',
    isTableFullscreen: false,
    isHorizontalTable: true,
    showTotals: false,
    isGroupingEnabled: false,
    expandedLevels: null,
    showTips: true,
    fields,
    previewRows: rows,
    verticalColumns: [],
    tableScrollRef: { current: null },
    onToggleTotals: () => undefined,
    onToggleGrouping: () => undefined,
    onExpandedLevelsChange: () => undefined,
    onToggleOrientation: () => undefined,
    onToggleFullscreen: () => undefined,
    getMappedValue: plainMappedValue,
    getRawValue: rawValue,
    formatFieldTotal: simpleFieldTotal,
    getFieldWarning: () => null,
    isGroupExpanded: () => true,
    onToggleGroup: () => undefined,
    ...overrides,
  }
  const result = render(<SampleRowsSection {...props} />)
  return { ...result, rerenderWith: (next: Partial<SampleRowsSectionProps>) => result.rerender(<SampleRowsSection {...props} {...next} />) }
}

describe('SampleRowsSection', () => {
  it('renders section with table jump target id', () => {
    renderSection()

    const section = screen.getByRole('heading', { name: 'Finance Sheet' }).closest('section')
    expect(section?.id).toBe('report-table')
  })

  it('toggles totals and reflects the pressed state', () => {
    const onToggleTotals = vi.fn()
    const { rerenderWith } = renderSection({ onToggleTotals })

    const totalsButton = screen.getByRole('button', { name: 'Totals' })
    expect(totalsButton).toHaveAttribute('aria-pressed', 'false')
    fireEvent.click(totalsButton)
    expect(onToggleTotals).toHaveBeenCalled()

    rerenderWith({ showTotals: true })
    expect(screen.getByRole('button', { name: 'Totals' })).toHaveAttribute('aria-pressed', 'true')
  })

  it('toggles grouping when the grouping button is clicked', () => {
    const onToggleGrouping = vi.fn()
    renderSection({ onToggleGrouping })

    fireEvent.click(screen.getByRole('button', { name: 'Grouping' }))
    expect(onToggleGrouping).toHaveBeenCalled()
  })

  it('offers outline levels only while grouping is on', () => {
    const onExpandedLevelsChange = vi.fn()
    const { rerenderWith } = renderSection({ onExpandedLevelsChange })
    expect(screen.queryByRole('combobox', { name: 'Show rows' })).toBeNull()

    rerenderWith({ isGroupingEnabled: true })
    const outline = screen.getByRole('combobox', { name: 'Show rows' })
    const options = Array.from(outline.querySelectorAll('option')).map((option) => option.textContent)
    expect(options).toEqual(['Region', 'Region › Store', 'All rows'])
    expect(outline).toHaveValue('all')

    fireEvent.change(outline, { target: { value: '0' } })
    expect(onExpandedLevelsChange).toHaveBeenCalledWith(0)
    fireEvent.change(outline, { target: { value: 'all' } })
    expect(onExpandedLevelsChange).toHaveBeenCalledWith(null)
  })

  it('treats an outline level past the last group as all rows', () => {
    renderSection({ isGroupingEnabled: true, expandedLevels: 5 })

    expect(screen.getByRole('combobox', { name: 'Show rows' })).toHaveValue('all')
  })

  it('locks body scroll while fullscreen is active and releases it on unmount', () => {
    const { rerenderWith, unmount } = renderSection()
    expect(document.body.classList.contains('seed-table-fullscreen-lock')).toBe(false)

    rerenderWith({ isTableFullscreen: true })
    expect(document.body.classList.contains('seed-table-fullscreen-lock')).toBe(true)

    unmount()
    expect(document.body.classList.contains('seed-table-fullscreen-lock')).toBe(false)
  })

  it('shows the grouping tip to editors only', () => {
    const { rerenderWith } = renderSection()
    expect(screen.getByRole('button', { name: 'Grouping' }).getAttribute('title')).toMatch(/^Tip:/)

    rerenderWith({ showTips: false })
    expect(screen.getByRole('button', { name: 'Grouping' }).getAttribute('title')).not.toMatch(/Tip/)
  })

  it('disables grouping toggle in vertical view', () => {
    renderSection({ isHorizontalTable: false })

    const groupingButton = screen.getByRole('button', { name: 'Grouping' })
    expect(groupingButton).toBeDisabled()
    expect(groupingButton).toHaveAttribute('aria-pressed', 'false')
    expect(groupingButton.closest('.grouping-toggle-wrapper')).toHaveAttribute('title', 'Switch to horizontal view to use grouping.')
  })
})
