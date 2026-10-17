import { useState } from 'react'
import EditModeToolbar from '../components/EditModeToolbar'
import MappingPanelSection from '../components/MappingPanelSection'
import ReportTableSection from '../components/ReportTableSection'
import FormulasSection from '../components/FormulasSection'
import ReportSettingsSection from '../components/ReportSettingsSection'
import SummaryChips from '../components/SummaryChips'
import { useFormulasPanelProps } from './model/useFormulasPanelProps'
import { useMappingPanelProps } from './model/useMappingPanelProps'
import { useReportSettingsProps, useTableSectionProps, useToolbarProps } from './model/useSectionProps'
import { useReportBuilder } from './useReportBuilder'

function ReportBuilderView() {
  const { state, computed } = useReportBuilder()
  const editModeToolbarProps = useToolbarProps()
  const reportSettingsProps = useReportSettingsProps()
  const mappingPanelProps = useMappingPanelProps()
  const formulasProps = useFormulasPanelProps()
  const tableSectionProps = useTableSectionProps()
  const { summaryItems } = computed
  const showAuthoring = state.ui.isEditMode
  const isTableFullscreen = state.ui.isTableFullscreen
  const [isSettingsCollapsed, setIsSettingsCollapsed] = useState(false)
  const [isColumnsCollapsed, setIsColumnsCollapsed] = useState(false)
  const [isFormulasCollapsed, setIsFormulasCollapsed] = useState(false)

  return (
    <div className="fr-report-builder">
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

      <ReportTableSection {...tableSectionProps} />
    </div>
  )
}

export default ReportBuilderView
