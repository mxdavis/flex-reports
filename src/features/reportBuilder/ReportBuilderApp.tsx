import type { ReportBuilderAppProps } from './types'
import ReportBuilderView from './report/ReportBuilderView'
import { useReportBuilderController } from './report/useReportBuilderController'
import './ReportBuilderApp.css'

function ReportBuilderApp({
  initialTableOrientation = 'horizontal',
  initialAggregateMode = 'none',
  initialEditMode = false,
}: ReportBuilderAppProps) {
  const controller = useReportBuilderController({
    initialTableOrientation,
    initialAggregateMode,
    initialEditMode,
  })

  return <ReportBuilderView {...controller} />
}

export default ReportBuilderApp
