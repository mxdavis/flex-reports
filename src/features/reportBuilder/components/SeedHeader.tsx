import './SeedHeader.css'
import { CURRENCY_SYMBOL_OPTIONS } from '../../../utils/currencySymbols'
import ChevronToggleIcon from '../../../shared/icons/ChevronToggleIcon'

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
      <div className="section-title-row">
        <h2>Report Settings</h2>
        {onToggleCollapsed && (
          <button
            type="button"
            className="collapse-toggle-button"
            onClick={onToggleCollapsed}
            aria-label={isCollapsed ? 'Expand settings' : 'Collapse settings'}
            aria-expanded={!isCollapsed}
            aria-controls="report-settings-content"
            title={isCollapsed ? 'Expand settings' : 'Collapse settings'}
          >
            <ChevronToggleIcon direction={isCollapsed ? 'down' : 'up'} />
          </button>
        )}
      </div>

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
      )}
    </header>
  )
}

export default SeedHeader
