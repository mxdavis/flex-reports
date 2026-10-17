import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import type { ReportField } from '../../../services/reportDefinition/types'
import ColumnHeaderLabel from './ColumnHeaderLabel'

const field: ReportField = { id: 'units', label: 'Units', sourceKey: 'units', displayType: 'number', aggregation: 'sum', currencySymbol: '' }

function renderHeader(warning: string | null) {
  render(<table><thead><tr><ColumnHeaderLabel field={field} warning={warning} /></tr></thead></table>)
}

describe('ColumnHeaderLabel', () => {
  it('renders a plain header without a warning', () => {
    renderHeader(null)

    expect(screen.getByRole('columnheader', { name: 'Units' })).not.toHaveAttribute('title')
  })

  it('flags the header and explains the warning on hover', () => {
    renderHeader('Source "units" is missing.')

    const header = screen.getByRole('columnheader', { name: 'Units (missing source)' })
    expect(header).toHaveAttribute('title', 'Source "units" is missing.')
  })
})
