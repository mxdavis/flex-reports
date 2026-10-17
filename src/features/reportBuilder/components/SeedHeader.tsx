import './SeedHeader.css'
import { CURRENCY_SYMBOL_OPTIONS } from '../../../utils/currencySymbols'
import SectionTitleRow from '../../../shared/components/SectionTitleRow'

export type SeedHeaderProps = {
  sheetName: string
  currencySymbol: string
  isCollapsed?: boolean
  onToggleCollapsed?: () => void
  onSheetNameChange: (nextValue: string) => void
  onCurrencySymbolChange: (nextValue: string) => void
}

function SeedHeader({
  sheetName,
  currencySymbol,
  isCollapsed = false,
  onToggleCollapsed,
  onSheetNameChange,
  onCurrencySymbolChange,
}: SeedHeaderProps) {
  return (
    <header className="seed-header">
      <SectionTitleRow
        title="Report Settings"
        sectionName="settings"
        contentId="report-settings-content"
        isCollapsed={isCollapsed}
        onToggleCollapsed={onToggleCollapsed}
      />

      {!isCollapsed && (
        <div id="report-settings-content" className="seed-header-controls">
          <div className="seed-header-sheet-name">
            <label htmlFor="sheet-name-input">Sheet name</label>
            <input
              id="sheet-name-input"
              type="text"
              value={sheetName}
              onChange={(event) => {
                onSheetNameChange(event.target.value)
              }}
              placeholder="Report"
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
      )}
    </header>
  )
}

export default SeedHeader
