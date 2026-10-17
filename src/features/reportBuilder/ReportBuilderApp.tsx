import type { ReportBuilderAppProps } from './types'
import ReportBuilderView from './report/ReportBuilderView'
import { useReportBuilderController } from './report/useReportBuilderController'
import './ReportBuilderApp.css'

function ReportBuilderApp({ initialEditMode = false, ...props }: ReportBuilderAppProps) {
  const controller = useReportBuilderController({ ...props, initialEditMode })

  return <ReportBuilderView {...controller} />
}

export default ReportBuilderApp
