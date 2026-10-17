import type { ReportBuilderAppProps } from './types'
import ReportBuilderView from './report/ReportBuilderView'
import ReportBuilderProvider from './report/ReportBuilderProvider'
import './ReportBuilderApp.css'

function ReportBuilderApp({ initialEditMode = false, ...props }: ReportBuilderAppProps) {
  return (
    <ReportBuilderProvider args={{ ...props, initialEditMode }}>
      <ReportBuilderView />
    </ReportBuilderProvider>
  )
}

export default ReportBuilderApp
