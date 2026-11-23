import { useEffect, useRef, useState } from 'react'
import type { ReportRow } from '../services/adapters'
import ConfirmDialog from '../shared/components/ConfirmDialog'
import { useElementId } from '../shared/hooks/useElementId'
import { MAX_RECORDS_BYTES, parseRecordsJson, RecordsLoadError } from './recordsJson'
import { useAddressLoad } from './useAddressLoad'
import './OwnDataPanel.css'

export type OwnData = { name: string, rows: ReportRow[] }

type OwnDataPanelProps = {
  // Called once the visitor confirms replacing their report.
  onReplace: (data: OwnData) => void
}

type Box = 'paste' | 'address'

function readError(error: unknown): string {
  if (error instanceof RecordsLoadError) return error.message
  console.error('[flex-reports app] Could not read the data.', error)
  return 'Couldn\'t read this data. Try again.'
}

// Open a JSON file, paste JSON, or load it from a web address. Everything is
// read here in the browser (nothing is uploaded), passes the same check, and
// replaces the report only once the visitor confirms. Until then the open box
// keeps what was typed, so Cancel changes nothing and focus goes back to Load.
function OwnDataPanel({ onReplace }: OwnDataPanelProps) {
  const fileInputRef = useRef<HTMLInputElement | null>(null)
  const boxButtonRefs = useRef<Record<Box, HTMLButtonElement | null>>({ paste: null, address: null })
  // Set when data from a box replaces the report: the box (and its Load
  // button, where the dialog would return focus) closes, so focus goes to the
  // button that opened the box instead.
  const focusAfterReplace = useRef<Box | null>(null)
  const pasteId = useElementId('own-data-paste')
  const addressId = useElementId('own-data-address')
  const [openBox, setOpenBox] = useState<Box | null>(null)
  const [pastedText, setPastedText] = useState('')
  const [address, setAddress] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [pending, setPending] = useState<OwnData | null>(null)
  const addressLoad = useAddressLoad({
    onLoaded: setPending,
    onFailed: (loadError) => setError(readError(loadError)),
  })

  // Opening or closing a box, either way, clears an earlier error and stops
  // a load that hasn't finished.
  function showBox(box: Box | null): void {
    addressLoad.stop()
    setOpenBox(box)
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
    setAddress('')
    focusAfterReplace.current = openBox
    showBox(null)
  }

  // Runs after the dialog has unmounted, so this focus isn't overridden.
  useEffect(() => {
    const box = focusAfterReplace.current
    if (openBox || !box) return
    focusAfterReplace.current = null
    boxButtonRefs.current[box]?.focus()
  }, [openBox])

  async function openFile(file: File): Promise<void> {
    // The file is the visitor's latest choice, so an unfinished address load
    // mustn't replace it in the dialog.
    addressLoad.stop()
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

  function boxButton(box: Box, label: string) {
    return (
      <button
        ref={(element) => {
          boxButtonRefs.current[box] = element
        }}
        type="button"
        aria-expanded={openBox === box}
        onClick={() => showBox(openBox === box ? null : box)}
      >
        {label}
      </button>
    )
  }

  const cancelButton = <button type="button" onClick={() => showBox(null)}>Cancel</button>

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
      {boxButton('paste', 'Paste JSON')}
      {boxButton('address', 'Load from address')}
      {openBox === 'paste' && (
        <div className="fr-app-own-data-box">
          <label htmlFor={pasteId}>Paste a list of records, like {'[{"name": "Ann", "hours": 2}, …]'}</label>
          <textarea
            id={pasteId}
            rows={6}
            spellCheck={false}
            value={pastedText}
            onChange={(event) => setPastedText(event.target.value)}
          />
          <div className="fr-app-own-data-actions">
            <button type="button" onClick={() => load('pasted data', pastedText)}>Load</button>
            {cancelButton}
          </div>
        </div>
      )}
      {openBox === 'address' && (
        <form
          className="fr-app-own-data-box"
          // Our own messages explain a bad address; the browser's would come first.
          noValidate
          onSubmit={(event) => {
            event.preventDefault()
            if (addressLoad.isLoading) return
            const trimmed = address.trim()
            setError(trimmed ? null : 'Enter a web address.')
            if (trimmed) void addressLoad.load(trimmed)
          }}
        >
          <label htmlFor={addressId}>Web address of a JSON list of records</label>
          <input
            id={addressId}
            type="url"
            inputMode="url"
            placeholder="https://example.com/orders.json"
            spellCheck={false}
            value={address}
            onChange={(event) => setAddress(event.target.value)}
          />
          <small>The site must allow browsers to read it (CORS).</small>
          <div className="fr-app-own-data-actions">
            {/* Not disabled while loading: that would drop focus to the page. */}
            <button type="submit" aria-disabled={addressLoad.isLoading}>
              {addressLoad.isLoading ? 'Loading…' : 'Load'}
            </button>
            {cancelButton}
          </div>
        </form>
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
