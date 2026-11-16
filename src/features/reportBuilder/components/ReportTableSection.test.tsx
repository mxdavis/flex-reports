import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import type { ReportRow } from '../../../services/adapters'
import type { ReportField } from '../../../services/reportDefinition/types'
import { plainFieldValue, rawValue, simpleFieldTotal } from '../../../test/simpleFieldTotal'
import ReportTableSection, { type ReportTableSectionProps } from './ReportTableSection'

const fields: ReportField[] = [
  { id: 'region', label: 'Region', sourceKey: 'region', displayType: 'string', aggregation: 'distinct' },
  { id: 'store', label: 'Store', sourceKey: 'store', displayType: 'string', aggregation: 'count' },
  { id: 'units', label: 'Units', sourceKey: 'units', displayType: 'number', aggregation: 'sum' },
]

const rows: ReportRow[] = [{ id: 'row1', region: 'North', store: 'Ames', units: 3 }]

function renderSection(overrides: Partial<ReportTableSectionProps> = {}) {
  const props: ReportTableSectionProps = {
    sheetName: 'Finance Sheet',
    isTableFullscreen: false,
    isHorizontalTable: true,
    showTotals: false,
    isGroupingOn: false, isGrouped: false,
    expandedLevels: null,
    outlineRowCounts: { byLevel: [2], all: 5 },
    maxVisibleRows: 1000,
    isOutlineCapped: false,
    isVerticalViewAvailable: true,
    maxVerticalViewRows: 100,
    exportOptions: [],
    showTips: true,
    fields,
    rows: rows,
    verticalColumns: [],
    scrollContainerRef: { current: null },
    onToggleTotals: () => undefined,
    onToggleGrouping: () => undefined,
    onExpandedLevelsChange: () => undefined,
    onToggleOrientation: () => undefined,
    onToggleFullscreen: () => undefined,
    getFieldValue: plainFieldValue,
    getRawValue: rawValue,
    formatFieldTotal: simpleFieldTotal,
    getFieldWarning: () => null,
    isGroupExpanded: () => true,
    onToggleGroup: () => undefined,
    ...overrides,
  }
  const result = render(<ReportTableSection {...props} />)
  return { ...result, rerenderWith: (next: Partial<ReportTableSectionProps>) => result.rerender(<ReportTableSection {...props} {...next} />) }
}

describe('ReportTableSection', () => {
  it('renders section with table jump target id', () => {
    renderSection()

    const section = screen.getByRole('heading', { name: 'Finance Sheet' }).closest('section')
    expect(section?.id).toBe('fr-report-table')
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

    rerenderWith({ isGroupingOn: true, isGrouped: true })
    const outline = screen.getByRole('combobox', { name: 'Show rows' })
    const options = Array.from(outline.querySelectorAll('option')).map((option) => option.textContent)
    // Region groups; Store names each row, so it isn't an outline level.
    expect(options).toEqual(['Region', 'All rows'])
    expect(outline).toHaveValue('all')

    fireEvent.change(outline, { target: { value: '0' } })
    expect(onExpandedLevelsChange).toHaveBeenCalledWith(0)
    fireEvent.change(outline, { target: { value: 'all' } })
    expect(onExpandedLevelsChange).toHaveBeenCalledWith(null)
  })

  it('disables levels over the row limit and explains when the report opened capped', () => {
    renderSection({
      isGroupingOn: true, isGrouped: true,
      expandedLevels: 0,
      outlineRowCounts: { byLevel: [400], all: 25000 },
      isOutlineCapped: true,
    })

    const allRows = screen.getByRole('option', { name: 'All rows (over 1,000 rows)' })
    expect(allRows).toBeDisabled()
    expect(screen.getByRole('option', { name: 'Region' })).toBeEnabled()
    expect(screen.getByRole('note')).toHaveTextContent('This report has 25,000 rows fully expanded, more than the 1,000-row limit, so it opens at Region.')
  })

  it('shows no limit note when the report fits', () => {
    renderSection({ isGroupingOn: true, isGrouped: true })

    expect(screen.queryByRole('note')).toBeNull()
    expect(screen.getByRole('option', { name: 'All rows' })).toBeEnabled()
  })

  it('locks body scroll while fullscreen is active and releases it on unmount', () => {
    const { rerenderWith, unmount } = renderSection()
    expect(document.body.classList.contains('fr-fullscreen-lock')).toBe(false)

    rerenderWith({ isTableFullscreen: true })
    expect(document.body.classList.contains('fr-fullscreen-lock')).toBe(true)

    unmount()
    expect(document.body.classList.contains('fr-fullscreen-lock')).toBe(false)
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
    expect(groupingButton.closest('.fr-hinted-button')).toHaveAttribute('title', 'Switch to horizontal view to use grouping.')
  })

  it('disables totals in vertical view', () => {
    renderSection({ isHorizontalTable: false, showTotals: true })

    const totalsButton = screen.getByRole('button', { name: 'Totals' })
    expect(totalsButton).toBeDisabled()
    expect(totalsButton).toHaveAttribute('aria-pressed', 'false')
    expect(totalsButton.closest('.fr-hinted-button')).toHaveAttribute('title', 'Totals are available in horizontal view.')
  })

  it('disables vertical view for reports over the row limit and says why', () => {
    renderSection({ isVerticalViewAvailable: false, rows: Array.from({ length: 150 }, (_, index) => ({ ...rows[0], id: `r${index}` })) })

    const verticalButton = screen.getByRole('button', { name: 'Vertical view' })
    expect(verticalButton).toBeDisabled()
    expect(verticalButton.closest('.fr-hinted-button')).toHaveAttribute('title', 'Vertical view is available for up to 100 rows. This report has 150.')
  })
})
