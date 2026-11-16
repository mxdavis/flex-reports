import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import ReportSettingsSection from './ReportSettingsSection'

describe('ReportSettingsSection', () => {
  it('renders sheet and currency controls', () => {
    render(
      <ReportSettingsSection
        sheetName="Ops Sheet"
        currencySymbol="$"
        onSheetNameChange={() => undefined}
        onCurrencySymbolChange={() => undefined}
      />,
    )
    expect(screen.getByRole('heading', { name: 'Report Settings' })).toBeInTheDocument()
    expect(screen.getByLabelText('Sheet name')).toHaveValue('Ops Sheet')
    expect(screen.getByLabelText('Currency symbol')).toHaveValue('$')
  })
})
