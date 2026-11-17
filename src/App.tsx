import { useState } from 'react'
import DataSourceBar from './app/DataSourceBar'
import LoadError from './app/LoadError'
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

  function resetToSample(): void {
    clearSavedReport()
    setSavedReport(undefined)
    setReportKey((key) => key + 1)
    reload()
  }

  return (
    <>
      <DataSourceBar sampleUrl={SAMPLE_DATA_URL} onReset={resetToSample} />
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
