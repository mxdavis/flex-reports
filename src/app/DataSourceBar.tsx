import OwnDataPanel, { type OwnData } from './OwnDataPanel'
import './DataSourceBar.css'

type DataSourceBarProps = {
  sampleUrl: string
  // The visitor's own data, once loaded; otherwise the sample is shown.
  ownDataName?: string
  recordCount?: number
  onReset: () => void
  onLoadOwnData: (data: OwnData) => void
}

function describeCount(count: number): string {
  return `${count.toLocaleString()} ${count === 1 ? 'record' : 'records'}`
}

// The app's controls for where the report's data comes from. Never part of
// the package: hosts pass their own rows in.
function DataSourceBar({ sampleUrl, ownDataName, recordCount, onReset, onLoadOwnData }: DataSourceBarProps) {
  const count = recordCount === undefined ? '' : ` · ${describeCount(recordCount)}`
  return (
    <section className="fr-app-data-bar" aria-label="Report data">
      <p>
        <strong>Data:</strong> {ownDataName ?? 'sample billing data'}{count}
        {!ownDataName && (
          <>
            {' · '}
            <a href={sampleUrl} download="sample-data.json">Download sample JSON</a>
          </>
        )}
      </p>
      <button type="button" onClick={onReset} title="Delete the saved report and start again on the sample data.">
        Reset to sample
      </button>
      <p className="fr-app-data-bar-note">Reports are saved in this browser only.</p>
      <OwnDataPanel onLoad={onLoadOwnData} />
    </section>
  )
}

export default DataSourceBar
