import { useState } from 'react'
import EditModeToolbar from '../components/EditModeToolbar'
import MappingPanelSection from '../components/MappingPanelSection'
import SampleRowsSection from '../components/SampleRowsSection'
import SeedFormulasSection from '../components/SeedFormulasSection'
import SeedHeader from '../components/SeedHeader'
import SeedStats from '../components/SeedStats'
import type { useReportBuilderController } from './useReportBuilderController'

type ReportBuilderViewProps = ReturnType<typeof useReportBuilderController>

function ReportBuilderView({
  issues,
  showAuthoring,
  summaryItems,
  editModeToolbarProps,
  seedHeaderProps,
  mappingPanelProps,
  seedFormulasProps,
  sampleRowsProps,
}: ReportBuilderViewProps) {
  const isTableFullscreen = sampleRowsProps.isTableFullscreen
  const [isSettingsCollapsed, setIsSettingsCollapsed] = useState(false)
  const [isColumnsCollapsed, setIsColumnsCollapsed] = useState(false)
  const [isFormulasCollapsed, setIsFormulasCollapsed] = useState(false)

  function renderReportIssues() {
    if (issues.length === 0) return null

    return (
      <div role="alert">
        {issues.map((issue) => <p key={issue}>{issue}</p>)}
      </div>
    )
  }

  function renderEmptyReportMessage() {
    if (sampleRowsProps.previewRows.length > 0) return null

    return <p role="status">No rows</p>
  }

  return (
    <div className="seed-page">
      {!isTableFullscreen && <EditModeToolbar {...editModeToolbarProps} />}

      {!isTableFullscreen && showAuthoring && (
        <SeedHeader
          {...seedHeaderProps}
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
        <SeedFormulasSection
          {...seedFormulasProps}
          isCollapsed={isFormulasCollapsed}
          onToggleCollapsed={() => {
            setIsFormulasCollapsed((previous) => !previous)
          }}
        />
      )}

      {!isTableFullscreen && summaryItems.length > 0 && (
        <SeedStats items={summaryItems} />
      )}

      {renderReportIssues()}
      {renderEmptyReportMessage()}
      <SampleRowsSection {...sampleRowsProps} />
    </div>
  )
}

export default ReportBuilderView
