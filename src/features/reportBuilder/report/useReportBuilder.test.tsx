import { render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import ReportBuilderProvider from './ReportBuilderProvider'
import { useReportBuilder } from './useReportBuilder'

function SheetName() {
  return <p>{useReportBuilder().state.sheetName}</p>
}

describe('useReportBuilder', () => {
  it('reads builder state from the provider', () => {
    render(
      <ReportBuilderProvider args={{ rows: [{ id: 'r1', units: 1 }], schema: [{ id: 'units', key: 'units', label: 'Units', dataType: 'number' }], role: 'viewer', initialEditMode: false }}>
        <SheetName />
      </ReportBuilderProvider>,
    )

    expect(screen.getByText('Report')).toBeInTheDocument()
  })

  it('throws a clear error outside the provider', () => {
    vi.spyOn(console, 'error').mockImplementation(() => undefined)

    expect(() => render(<SheetName />)).toThrow('useReportBuilder must be used inside ReportBuilderProvider.')
  })
})
