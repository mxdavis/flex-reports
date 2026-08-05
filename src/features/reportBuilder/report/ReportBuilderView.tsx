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
  return (
    <div className="seed-page">
      <EditModeToolbar {...editModeToolbarProps} />

      {showAuthoring && (
        <SeedHeader {...seedHeaderProps} />
      )}

      {showAuthoring && (
        <MappingPanelSection {...mappingPanelProps} />
      )}

      {showAuthoring && (
        <SeedFormulasSection {...seedFormulasProps} />
      )}

      {summaryItems.length > 0 && (
        <SeedStats items={summaryItems} />
      )}

      <SampleRowsSection {...sampleRowsProps} />
    </div>
  )
}

export default ReportBuilderView
