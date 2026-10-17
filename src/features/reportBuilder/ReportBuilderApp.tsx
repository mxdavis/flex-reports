import type { ReportBuilderAppProps } from './types'
import ReportBuilderView from './report/ReportBuilderView'
import ReportBuilderProvider from './report/ReportBuilderProvider'
import { useSandboxData } from './report/useSandboxData'
import './ReportBuilderApp.css'

function ReportBuilderApp({ initialEditMode = false, ...props }: ReportBuilderAppProps) {
  const isSandbox = props.rows === undefined
  const sandboxData = useSandboxData(isSandbox)

  if (isSandbox && !sandboxData) {
    return <p className="report-builder-loading" role="status">Loading sample data…</p>
  }

  return (
    <ReportBuilderProvider args={{ ...props, initialEditMode, sandboxData: sandboxData ?? undefined }}>
      <ReportBuilderView />
    </ReportBuilderProvider>
  )
}

export default ReportBuilderApp
