import { parse, printParseErrorCode, type ParseError } from 'jsonc-parser'
import type { ReportRow } from '../services/adapters'

export const MAX_RECORDS_BYTES = 5 * 1024 * 1024

// A failure to show the user as-is: every message is written for them.
export class RecordsLoadError extends Error {}

const EXAMPLE = 'like [{"name": "Ann", "hours": 2}, …]'

// Where JSON first breaks, as an offset into the text, or undefined if it is valid.
// Browsers word their own errors differently and some give no position, so
// the text is read again with a parser that reports one.
export function findJsonError(text: string): { offset: number, cutOff: boolean } | undefined {
  const errors: ParseError[] = []
  parse(text, errors, { disallowComments: true, allowTrailingComma: false })
  const [first] = errors
  if (!first) return undefined
  // Breaking at the very end, or in text that never closes, means it stopped
  // early (an interrupted download, or a partial copy).
  const cutOff = first.offset >= text.trimEnd().length
    || (printParseErrorCode(first.error) === 'UnexpectedEndOfString' && !text.slice(first.offset + 1).includes('"'))
  return { offset: first.offset, cutOff }
}

function describeLocation(text: string, offset: number): string {
  const before = text.slice(0, offset)
  const line = before.split('\n').length
  const character = before.length - before.lastIndexOf('\n')
  return `Check line ${line}, character ${character}.`
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
  } catch {
    const error = findJsonError(text)
    if (error?.cutOff) {
      throw new RecordsLoadError('This JSON stops before it\'s finished, so it may be cut off. Check it\'s complete, or load it again.')
    }
    throw new RecordsLoadError(`This isn't valid JSON. ${error ? describeLocation(text, error.offset) : ''}`.trim())
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
