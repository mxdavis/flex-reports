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

      <SampleRowsSection {...sampleRowsProps} />
    </div>
  )
}

export default ReportBuilderView
