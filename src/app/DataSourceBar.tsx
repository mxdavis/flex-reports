import './DataSourceBar.css'

type DataSourceBarProps = {
  sampleUrl: string
  onReset: () => void
}

// The app's controls for where the report's data comes from. Never part of
// the package: hosts pass their own rows in.
function DataSourceBar({ sampleUrl, onReset }: DataSourceBarProps) {
  return (
    <section className="fr-app-data-bar" aria-label="Report data">
      <p>
        <strong>Data:</strong> sample billing data{' · '}
        <a href={sampleUrl} download="sample-data.json">Download sample JSON</a>
      </p>
      <button type="button" onClick={onReset} title="Delete the saved report and start again on the sample data.">
        Reset to sample
      </button>
      <p className="fr-app-data-bar-note">Reports are saved in this browser only.</p>
    </section>
  )
}

export default DataSourceBar
