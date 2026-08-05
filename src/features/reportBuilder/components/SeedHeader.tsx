import './SeedHeader.css'
import { CURRENCY_SYMBOL_OPTIONS } from '../../../utils/currencySymbols'

export type SeedHeaderProps = {
  sheetName: string
  currencySymbol: string
  onSheetNameChange: (nextValue: string) => void
  onCurrencySymbolChange: (nextValue: string) => void
}

function SeedHeader({
  sheetName,
  currencySymbol,
  onSheetNameChange,
  onCurrencySymbolChange,
}: SeedHeaderProps) {
  return (
    <header className="seed-header">
      <h1>Flex Reports Seed Playground</h1>
      <p>
        Billing-style mock data is loaded from JSON so we can build and test
        reports without a database.
      </p>
      <div className="seed-header-controls">
        <div className="seed-header-sheet-name">
          <label htmlFor="sheet-name-input">Sheet name</label>
          <input
            id="sheet-name-input"
            type="text"
            value={sheetName}
            onChange={(event) => {
              onSheetNameChange(event.target.value)
            }}
            placeholder="Sample rows"
          />
        </div>

        <div className="seed-header-currency-symbol">
          <label htmlFor="global-currency-symbol">Currency symbol</label>
          <select
            id="global-currency-symbol"
            value={currencySymbol}
            title="Used for all currency values in this report preview."
            onChange={(event) => {
              onCurrencySymbolChange(event.target.value)
            }}
          >
            {CURRENCY_SYMBOL_OPTIONS.map((symbol) => (
              <option key={symbol} value={symbol}>{symbol}</option>
            ))}
          </select>
        </div>
      </div>
    </header>
  )
}

export default SeedHeader
