import { useState } from 'react'
import DataSourceBar from './app/DataSourceBar'
import LoadError from './app/LoadError'
import ConfirmDialog from './shared/components/ConfirmDialog'
import { clearSavedReport, loadSavedReport, saveReport } from './app/savedReport'
import { useRecordsFromUrl } from './app/useRecordsFromUrl'
import ReportBuilderApp from './features/reportBuilder/ReportBuilderApp'
import type { ReportBuilderAppProps } from './features/reportBuilder/types'

// The sample records, served next to the app (public/sample-data.json), so the
// app reads them the same way it would read any endpoint.
export const SAMPLE_DATA_URL = `${import.meta.env.BASE_URL}sample-data.json`

type AppProps = Pick<ReportBuilderAppProps, 'role' | 'initialEditMode'>

// The app: the report builder package, fed records from an endpoint, with the
// report saved in this browser.
function App(props: AppProps) {
  const { rows, error, reload } = useRecordsFromUrl(SAMPLE_DATA_URL)
  const [savedReport, setSavedReport] = useState(loadSavedReport)
  // Bumped on reset so the builder starts over from the (now empty) saved report.
  const [reportKey, setReportKey] = useState(0)
  const [isConfirmingReset, setIsConfirmingReset] = useState(false)

  function resetToSample(): void {
    setIsConfirmingReset(false)
    clearSavedReport()
    setSavedReport(undefined)
    setReportKey((key) => key + 1)
    reload()
  }

  return (
    <>
      <DataSourceBar sampleUrl={SAMPLE_DATA_URL} onReset={() => setIsConfirmingReset(true)} />
      <ConfirmDialog
        isOpen={isConfirmingReset}
        title="Start over with the sample data?"
        message="This deletes your saved report and any changes you haven't saved. You can't undo this."
        confirmLabel="Delete and start over"
        isDestructive
        onConfirm={resetToSample}
        onCancel={() => setIsConfirmingReset(false)}
      />
      {error ? <LoadError message={error} onRetry={reload} /> : (
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
