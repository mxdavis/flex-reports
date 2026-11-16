import './ReportSettingsSection.css'
import { useElementId } from '../../../shared/hooks/useElementId'
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
  const globalCurrencySymbolId = useElementId('global-currency-symbol')
  const reportSettingsContentId = useElementId('report-settings-content')
  const sheetNameInputId = useElementId('sheet-name-input')
  return (
    <header className="fr-report-settings">
      <SectionTitleRow
        title="Report Settings"
        sectionName="settings"
        contentId={reportSettingsContentId}
        isCollapsed={isCollapsed}
        onToggleCollapsed={onToggleCollapsed}
      />

      {!isCollapsed && (
        <div id={reportSettingsContentId} className="fr-report-settings-controls">
          <div className="fr-report-settings-sheet-name">
            <label htmlFor={sheetNameInputId}>Sheet name</label>
            <input
              id={sheetNameInputId}
              type="text"
              value={sheetName}
              onChange={(event) => {
                onSheetNameChange(event.target.value)
              }}
              placeholder={DEFAULT_SHEET_NAME}
            />
          </div>

          <div className="fr-report-settings-currency-symbol">
            <label htmlFor={globalCurrencySymbolId}>Currency symbol</label>
            <select
              id={globalCurrencySymbolId}
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
