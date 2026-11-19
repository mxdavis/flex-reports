import { useState } from 'react'
import DataSourceBar from './app/DataSourceBar'
import LoadError from './app/LoadError'
import type { OwnData } from './app/OwnDataPanel'
import ConfirmDialog from './shared/components/ConfirmDialog'
import { clearSavedReport, loadSavedReport, saveReport } from './app/savedReport'
import { useRecordsFromUrl } from './app/useRecordsFromUrl'
import ReportBuilderApp from './features/reportBuilder/ReportBuilderApp'
import type { ReportBuilderAppProps } from './features/reportBuilder/types'

// The sample records, served next to the app (public/sample-data.json), so the
// app reads them the same way it would read any endpoint.
export const SAMPLE_DATA_URL = `${import.meta.env.BASE_URL}sample-data.json`

type AppProps = Pick<ReportBuilderAppProps, 'role' | 'initialEditMode'>

// The app: the report builder package, fed the sample records from an
// endpoint or the visitor's own JSON, with the report saved in this browser.
// The visitor's data stays in memory only; a reload goes back to the sample.
function App(props: AppProps) {
  const sample = useRecordsFromUrl(SAMPLE_DATA_URL)
  const [ownData, setOwnData] = useState<OwnData | null>(null)
  const [savedReport, setSavedReport] = useState(loadSavedReport)
  // Bumped to start the builder over from the (now empty) saved report.
  const [reportKey, setReportKey] = useState(0)
  const [isConfirmingReset, setIsConfirmingReset] = useState(false)
  const rows = ownData ? ownData.rows : sample.rows
  const error = ownData ? undefined : sample.error

  function startNewReport(): void {
    clearSavedReport()
    setSavedReport(undefined)
    setReportKey((key) => key + 1)
  }

  function resetToSample(): void {
    setIsConfirmingReset(false)
    setOwnData(null)
    startNewReport()
    sample.reload()
  }

  function replaceWithOwnData(data: OwnData): void {
    setOwnData(data)
    startNewReport()
  }

  return (
    <>
      <DataSourceBar
        sampleUrl={SAMPLE_DATA_URL}
        ownDataName={ownData?.name}
        recordCount={rows?.length}
        onReset={() => setIsConfirmingReset(true)}
        onReplaceWithOwnData={replaceWithOwnData}
      />
      <ConfirmDialog
        isOpen={isConfirmingReset}
        title="Start over with the sample data?"
        message="This deletes your saved report and any changes you haven't saved. You can't undo this."
        confirmLabel="Delete and start over"
        isDestructive
        onConfirm={resetToSample}
        onCancel={() => setIsConfirmingReset(false)}
      />
      {error ? <LoadError message={error} onRetry={sample.reload} /> : (
        <ReportBuilderApp
          key={reportKey}
          rows={rows}
          reportDefinition={savedReport}
          onSave={saveReport}
          {...props}
        />
      )}
    </>
  )
}

export default App
