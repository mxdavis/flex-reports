import type { ReportRow } from '../services/adapters'

export const MAX_RECORDS_BYTES = 5 * 1024 * 1024

// A failure to show the user as-is: every message is written for them.
export class RecordsLoadError extends Error {}

const EXAMPLE = 'like [{"name": "Ann", "hours": 2}, …]'

// Where the browser says the JSON broke, as an offset into the text.
// Browsers word this differently ("at position 42", "at line 3 column 5");
// one that says neither gives no location.
function errorOffset(text: string, message: string): number | undefined {
  const position = /position (\d+)/i.exec(message)
  if (position) return Number(position[1])
  const lineColumn = /line (\d+) column (\d+)/i.exec(message)
  if (!lineColumn) return undefined
  const lines = text.split('\n').slice(0, Number(lineColumn[1]) - 1)
  return lines.reduce((total, line) => total + line.length + 1, 0) + Number(lineColumn[2]) - 1
}

function describeLocation(text: string, offset: number): string {
  const before = text.slice(0, offset)
  const line = before.split('\n').length
  const character = before.length - before.lastIndexOf('\n')
  return ` Check line ${line}, character ${character}.`
}

// JSON that breaks at its very end, or inside text that never closes, was
// most likely cut off (an interrupted download, or a partial copy).
function looksCutOff(text: string, message: string, offset: number | undefined): boolean {
  if (/end of (json )?(input|data)|EOF|unterminated/i.test(message)) return true
  return offset !== undefined && offset >= text.trimEnd().length - 1
}

function isRecord(value: unknown): value is ReportRow {
  return value !== null && typeof value === 'object' && !Array.isArray(value)
}

// The lists inside an object, to name them when someone gives a wrapper
// ({ "clients": [...] }) instead of the list itself.
function listNames(value: ReportRow): string[] {
  return Object.keys(value).filter((key) => Array.isArray(value[key]))
}

// Reads text that should be a JSON list of records: pasted, opened from a
// file, or returned by a web address. Every problem becomes a plain message,
// and nothing is returned unless the whole list passes.
export function parseRecordsJson(text: string): ReportRow[] {
  if (new TextEncoder().encode(text).byteLength > MAX_RECORDS_BYTES) {
    throw new RecordsLoadError('This data is larger than 5 MB.')
  }
  if (!text.trim()) throw new RecordsLoadError(`There's no data here. Provide a list of records, ${EXAMPLE}.`)

  let data: unknown
  try {
    data = JSON.parse(text)
  } catch (error) {
    const message = error instanceof Error ? error.message : ''
    const offset = errorOffset(text, message)
    if (looksCutOff(text, message, offset)) {
      throw new RecordsLoadError('This JSON stops before it\'s finished, so it may be cut off. Check it\'s complete, or load it again.')
    }
    throw new RecordsLoadError(`This isn't valid JSON.${offset === undefined ? '' : describeLocation(text, offset)}`)
  }

  if (!Array.isArray(data)) {
    if (isRecord(data)) {
      const lists = listNames(data)
      if (lists.length > 0) {
        throw new RecordsLoadError(`This data holds ${lists.length === 1 ? 'a list' : 'lists'} inside it (${lists.join(', ')}). Provide just the list of records, ${EXAMPLE}.`)
      }
      throw new RecordsLoadError(`This is a single record. Provide a list of records, ${EXAMPLE}.`)
    }
    throw new RecordsLoadError(`Provide a list of records, ${EXAMPLE}.`)
  }

  const badIndex = data.findIndex((entry) => !isRecord(entry))
  if (badIndex >= 0) {
    throw new RecordsLoadError(`Entry ${badIndex + 1} in the list isn't a record. Each entry needs names and values in { }, ${EXAMPLE}.`)
  }
  return data as ReportRow[]
}
