import { useRef, useState } from 'react'
import type { ReportRow } from '../services/adapters'
import { useElementId } from '../shared/hooks/useElementId'
import { MAX_RECORDS_BYTES, parseRecordsJson, RecordsLoadError } from './recordsJson'

export type OwnData = { name: string, rows: ReportRow[] }

type OwnDataPanelProps = {
  onLoad: (data: OwnData) => void
}

function readError(error: unknown): string {
  if (error instanceof RecordsLoadError) return error.message
  console.error('[flex-reports app] Could not read the data.', error)
  return 'Couldn\'t read this data. Try again.'
}

// Open a JSON file or paste JSON. Both are read here in the browser (nothing
// is uploaded) and pass the same check before the app is offered the records.
function OwnDataPanel({ onLoad }: OwnDataPanelProps) {
  const fileInputRef = useRef<HTMLInputElement | null>(null)
  const pasteId = useElementId('own-data-paste')
  const [isPasting, setIsPasting] = useState(false)
  const [pastedText, setPastedText] = useState('')
  const [error, setError] = useState<string | null>(null)

  function load(name: string, text: string): void {
    try {
      onLoad({ name, rows: parseRecordsJson(text) })
      setError(null)
      setIsPasting(false)
      setPastedText('')
    } catch (loadError) {
      setError(readError(loadError))
    }
  }

  async function openFile(file: File): Promise<void> {
    if (file.size > MAX_RECORDS_BYTES) {
      setError('This data is larger than 5 MB.')
      return
    }
    try {
      load(file.name, await file.text())
    } catch (fileError) {
      setError(readError(fileError))
    }
  }

  return (
    <div className="fr-app-own-data">
      <span>Use your own data:</span>
      <button type="button" onClick={() => fileInputRef.current?.click()}>Open JSON file…</button>
      <input
        ref={fileInputRef}
        type="file"
        accept=".json,application/json"
        hidden
        aria-label="JSON file"
        onChange={(event) => {
          const file = event.target.files?.[0]
          // Cleared so picking the same file again (after fixing it) loads it again.
          event.target.value = ''
          if (file) void openFile(file)
        }}
      />
      <button type="button" aria-expanded={isPasting} onClick={() => setIsPasting((open) => !open)}>
        Paste JSON
      </button>
      {isPasting && (
        <div className="fr-app-paste">
          <label htmlFor={pasteId}>Paste a list of records, like {'[{"name": "Ann", "hours": 2}, …]'}</label>
          <textarea
            id={pasteId}
            rows={6}
            spellCheck={false}
            value={pastedText}
            onChange={(event) => setPastedText(event.target.value)}
          />
          <div className="fr-app-paste-actions">
            <button type="button" onClick={() => load('pasted data', pastedText)}>Load</button>
            <button
              type="button"
              onClick={() => {
                setIsPasting(false)
                setError(null)
              }}
            >
              Cancel
            </button>
          </div>
        </div>
      )}
      {error && <p className="fr-app-own-data-error" role="alert">{error}</p>}
    </div>
  )
}

export default OwnDataPanel
