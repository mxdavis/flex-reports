import { useRef } from 'react'
import type { ReportRow } from '../../services/adapters'
import type { ReportBuilderAppProps } from './types'
import ReportBuilderView from './report/ReportBuilderView'
import ReportBuilderProvider from './report/ReportBuilderProvider'
import './ReportBuilderApp.css'

function ReportBuilderApp({ initialEditMode = false, ...props }: ReportBuilderAppProps) {
  // Missing rows mean the host is still loading. Once rows
  // have arrived they're kept, so a refetch that briefly clears them doesn't
  // unmount the builder and lose unsaved edits.
  const lastRowsRef = useRef<ReportRow[] | undefined>(undefined)
  if (props.rows !== undefined) lastRowsRef.current = props.rows
  const rows = props.rows ?? lastRowsRef.current

  if (rows === undefined) {
    return <p className="fr-report-builder-loading" role="status">Loading report…</p>
  }

  return (
    <ReportBuilderProvider args={{ ...props, rows, initialEditMode }}>
      <ReportBuilderView />
    </ReportBuilderProvider>
  )
}

export default ReportBuilderApp
