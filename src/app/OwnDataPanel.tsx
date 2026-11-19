import { useEffect, useRef, useState } from 'react'
import type { ReportRow } from '../services/adapters'
import ConfirmDialog from '../shared/components/ConfirmDialog'
import { useElementId } from '../shared/hooks/useElementId'
import { MAX_RECORDS_BYTES, parseRecordsJson, RecordsLoadError } from './recordsJson'
import './OwnDataPanel.css'

export type OwnData = { name: string, rows: ReportRow[] }

type OwnDataPanelProps = {
  // Called once the visitor confirms replacing their report.
  onReplace: (data: OwnData) => void
}

function readError(error: unknown): string {
  if (error instanceof RecordsLoadError) return error.message
  console.error('[flex-reports app] Could not read the data.', error)
  return 'Couldn\'t read this data. Try again.'
}

// Open a JSON file or paste JSON. Both are read here in the browser (nothing
// is uploaded), pass the same check, and replace the report only once the
// visitor confirms. Until then the paste box keeps its text, so Cancel
// changes nothing and focus goes back to Load.
function OwnDataPanel({ onReplace }: OwnDataPanelProps) {
  const fileInputRef = useRef<HTMLInputElement | null>(null)
  const pasteButtonRef = useRef<HTMLButtonElement | null>(null)
  // Set when a paste replaces the report: the box (and its Load button, where
  // the dialog would return focus) closes, so focus goes to Paste JSON instead.
  const shouldFocusPasteButton = useRef(false)
  const pasteId = useElementId('own-data-paste')
  const [isPasting, setIsPasting] = useState(false)
  const [pastedText, setPastedText] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [pending, setPending] = useState<OwnData | null>(null)

  // Opening or closing the paste box, either way, clears an earlier error.
  function showPasteBox(open: boolean): void {
    setIsPasting(open)
    setError(null)
  }

  function load(name: string, text: string): void {
    try {
      setPending({ name, rows: parseRecordsJson(text) })
      setError(null)
    } catch (loadError) {
      setError(readError(loadError))
    }
  }

  function replace(): void {
    if (!pending) return
    onReplace(pending)
    setPending(null)
    setPastedText('')
    shouldFocusPasteButton.current = isPasting
    showPasteBox(false)
  }

  // Runs after the dialog has unmounted, so this focus isn't overridden.
  useEffect(() => {
    if (isPasting || !shouldFocusPasteButton.current) return
    shouldFocusPasteButton.current = false
    pasteButtonRef.current?.focus()
  }, [isPasting])

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
      <button ref={pasteButtonRef} type="button" aria-expanded={isPasting} onClick={() => showPasteBox(!isPasting)}>
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
            <button type="button" onClick={() => showPasteBox(false)}>Cancel</button>
          </div>
        </div>
      )}
      {error && <p className="fr-app-own-data-error" role="alert">{error}</p>}
      <ConfirmDialog
        isOpen={pending !== null}
        title="Replace your report?"
        message={`This starts a new report on ${pending?.name ?? 'your data'} and deletes your saved report. Your data isn't uploaded anywhere.`}
        confirmLabel="Replace report"
        isDestructive
        onConfirm={replace}
        onCancel={() => setPending(null)}
      />
    </div>
  )
}

export default OwnDataPanel
