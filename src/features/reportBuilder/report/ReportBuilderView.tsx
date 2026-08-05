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

  return (
    <div className="seed-page">
      {!isTableFullscreen && <EditModeToolbar {...editModeToolbarProps} />}

      {!isTableFullscreen && showAuthoring && (
        <SeedHeader {...seedHeaderProps} />
      )}

      {!isTableFullscreen && showAuthoring && (
        <MappingPanelSection {...mappingPanelProps} />
      )}

      {!isTableFullscreen && showAuthoring && (
        <SeedFormulasSection {...seedFormulasProps} />
      )}

      {!isTableFullscreen && summaryItems.length > 0 && (
        <SeedStats items={summaryItems} />
      )}

      <SampleRowsSection {...sampleRowsProps} />
    </div>
  )
}

export default ReportBuilderView
