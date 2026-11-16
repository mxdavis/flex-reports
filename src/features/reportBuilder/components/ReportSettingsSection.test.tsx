import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import ReportSettingsSection from './ReportSettingsSection'

describe('ReportSettingsSection', () => {
  it('renders sheet and currency controls', () => {
    render(
      <ReportSettingsSection
        sheetName="Ops Sheet"
        currencySymbol="$"
        numberFormat="commas"
        onSheetNameChange={() => undefined}
        onCurrencySymbolChange={() => undefined}
        onNumberFormatChange={() => undefined}
      />,
    )
    expect(screen.getByRole('heading', { name: 'Report Settings' })).toBeInTheDocument()
    expect(screen.getByLabelText('Sheet name')).toHaveValue('Ops Sheet')
    expect(screen.getByLabelText('Currency symbol')).toHaveValue('$')
    expect(screen.getByLabelText('Number format')).toHaveValue('commas')
  })
})
