import { useRef } from 'react'
import type { ReportRow } from '../../services/adapters'
import type { ReportBuilderAppProps } from './types'
import ReportBuilderView from './report/ReportBuilderView'
import ReportBuilderProvider from './report/ReportBuilderProvider'
import { useSandboxData } from './report/useSandboxData'
import './ReportBuilderApp.css'

function ReportBuilderApp({ initialEditMode = false, sandbox = false, ...props }: ReportBuilderAppProps) {
  const sandboxData = useSandboxData(sandbox)

  // Missing rows mean the host is still loading, never sandbox mode. Once rows
  // have arrived they're kept, so a refetch that briefly clears them doesn't
  // unmount the builder and lose unsaved edits.
  const lastRowsRef = useRef<ReportRow[] | undefined>(undefined)
  if (props.rows !== undefined) lastRowsRef.current = props.rows
  const rows = props.rows ?? lastRowsRef.current

  if (sandbox ? !sandboxData : rows === undefined) {
    return (
      <p className="fr-report-builder-loading" role="status">
        {sandbox ? 'Loading sample data…' : 'Loading report…'}
      </p>
    )
  }

  return (
    <ReportBuilderProvider args={{ ...props, rows, initialEditMode, sandboxData: sandboxData ?? undefined }}>
      <ReportBuilderView />
    </ReportBuilderProvider>
  )
}

export default ReportBuilderApp
