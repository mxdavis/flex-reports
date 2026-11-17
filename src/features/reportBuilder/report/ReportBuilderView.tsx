import { useRef, useState } from 'react'
import { PrintModeContext, usePrintMode } from '../../../shared/hooks/usePrintMode'
import EditModeToolbar from '../components/EditModeToolbar'
import MappingPanelSection from '../components/MappingPanelSection'
import ReportTableSection from '../components/ReportTableSection'
import FormulasSection from '../components/FormulasSection'
import GettingStarted from '../components/GettingStarted'
import ReportSettingsSection from '../components/ReportSettingsSection'
import SummaryChips from '../components/SummaryChips'
import { useFormulasPanelProps } from './model/useFormulasPanelProps'
import { useGettingStartedProps } from './model/useGettingStartedProps'
import { useMappingPanelProps } from './model/useMappingPanelProps'
import { useReportSettingsProps, useTableSectionProps, useToolbarProps } from './model/useSectionProps'
import { DEFAULT_SHEET_NAME } from '../config'
import { useReportBuilder } from './useReportBuilder'

function ReportBuilderView() {
  const { state, computed } = useReportBuilder()
  const editModeToolbarProps = useToolbarProps()
  const reportSettingsProps = useReportSettingsProps()
  const mappingPanelProps = useMappingPanelProps()
  const formulasProps = useFormulasPanelProps()
  const gettingStartedProps = useGettingStartedProps()
  const rootRef = useRef<HTMLDivElement | null>(null)
  const { isPrinting, print } = usePrintMode(rootRef, reportSettingsProps.sheetName.trim() || DEFAULT_SHEET_NAME)
  const tableSectionProps = useTableSectionProps({ onPrint: print })
  const { summaryItems } = computed
  const showAuthoring = state.ui.isEditMode
  const isTableFullscreen = state.ui.isTableFullscreen
  const [isSettingsCollapsed, setIsSettingsCollapsed] = useState(false)
  const [isColumnsCollapsed, setIsColumnsCollapsed] = useState(false)
  const [isFormulasCollapsed, setIsFormulasCollapsed] = useState(false)

  function renderReportIssues() {
    const issues = [state.sourceError, ...state.definitionIssues, ...computed.issues].filter(Boolean)
    return issues.length > 0 && <div role="alert">{issues.map((issue, index) => <p key={`${index}-${issue}`}>{issue}</p>)}</div>
  }

  function renderNoColumnsMessage() {
    const nextStep = showAuthoring ? 'Tick fields under Getting started to add them.' : 'Open Edit mode to choose its columns.'
    return (
      <p className="fr-no-columns" role="status">
        <strong>This report has no columns yet.</strong> {nextStep}
      </p>
    )
  }

  function renderEmptyReportMessage() {
    // A report with no columns shows its own message: picking columns comes first.
    return state.rows.length === 0 && state.fields.length > 0 && !state.sourceError && <p role="status">No rows</p>
  }

  return (
    <PrintModeContext.Provider value={isPrinting}>
      <div className="fr-report-builder" ref={rootRef}>
        {!isTableFullscreen && <EditModeToolbar {...editModeToolbarProps} />}

        {!isTableFullscreen && showAuthoring && (
          <ReportSettingsSection
            {...reportSettingsProps}
            isCollapsed={isSettingsCollapsed}
            onToggleCollapsed={() => {
              setIsSettingsCollapsed((previous) => !previous)
            }}
          />
        )}

        {!isTableFullscreen && showAuthoring && gettingStartedProps && <GettingStarted {...gettingStartedProps} />}

        {!isTableFullscreen && showAuthoring && (
          <MappingPanelSection
            {...mappingPanelProps}
            isCollapsed={isColumnsCollapsed}
            onToggleCollapsed={() => {
              setIsColumnsCollapsed((previous) => !previous)
            }}
          />
        )}

        {!isTableFullscreen && showAuthoring && (
          <FormulasSection
            {...formulasProps}
            isCollapsed={isFormulasCollapsed}
            onToggleCollapsed={() => {
              setIsFormulasCollapsed((previous) => !previous)
            }}
          />
        )}

        {!isTableFullscreen && summaryItems.length > 0 && (
          <SummaryChips items={summaryItems} />
        )}

        {renderReportIssues()}
        {renderEmptyReportMessage()}
        {state.fields.length > 0 ? <ReportTableSection {...tableSectionProps} /> : renderNoColumnsMessage()}
      </div>
    </PrintModeContext.Provider>
  )
}

export default ReportBuilderView
