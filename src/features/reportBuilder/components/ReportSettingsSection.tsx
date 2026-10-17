import './ReportSettingsSection.css'
import { CURRENCY_SYMBOL_OPTIONS } from '../../../utils/currencySymbols'
import SectionTitleRow from '../../../shared/components/SectionTitleRow'
import { DEFAULT_SHEET_NAME } from '../config'

export type ReportSettingsSectionProps = {
  sheetName: string
  currencySymbol: string
  isCollapsed?: boolean
  onToggleCollapsed?: () => void
  onSheetNameChange: (nextValue: string) => void
  onCurrencySymbolChange: (nextValue: string) => void
}

function ReportSettingsSection({
  sheetName,
  currencySymbol,
  isCollapsed = false,
  onToggleCollapsed,
  onSheetNameChange,
  onCurrencySymbolChange,
}: ReportSettingsSectionProps) {
  return (
    <header className="fr-report-settings">
      <SectionTitleRow
        title="Report Settings"
        sectionName="settings"
        contentId="fr-report-settings-content"
        isCollapsed={isCollapsed}
        onToggleCollapsed={onToggleCollapsed}
      />

      {!isCollapsed && (
        <div id="fr-report-settings-content" className="fr-report-settings-controls">
          <div className="fr-report-settings-sheet-name">
            <label htmlFor="fr-sheet-name-input">Sheet name</label>
            <input
              id="fr-sheet-name-input"
              type="text"
              value={sheetName}
              onChange={(event) => {
                onSheetNameChange(event.target.value)
              }}
              placeholder={DEFAULT_SHEET_NAME}
            />
          </div>

          <div className="fr-report-settings-currency-symbol">
            <label htmlFor="fr-global-currency-symbol">Currency symbol</label>
            <select
              id="fr-global-currency-symbol"
              value={currencySymbol}
              title="Used for all currency values in this report."
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

export default ReportSettingsSection
