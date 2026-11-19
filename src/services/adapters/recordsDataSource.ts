import type { ReportRow, SchemaField } from './types'
import { formatFieldPath, readFieldPath } from './fieldPath'
import { guessDataType } from './guessDataType'

const rowKeys = new WeakMap<ReportRow, string>()
let nextRowKey = 0

function validateValue(value: unknown, parents: Set<object>): void {
  if (value == null || ['string', 'number', 'boolean'].includes(typeof value)) return
  if (value instanceof Date) return
  if (typeof value !== 'object') throw new Error('Report data must contain JSON-compatible values.')
  if (parents.has(value)) throw new Error('Report data contains a circular reference.')
  if (!Array.isArray(value) && Object.getPrototypeOf(value) !== Object.prototype && Object.getPrototypeOf(value) !== null) {
    throw new Error('Report data must contain plain objects, not class instances.')
  }
  if (Object.getOwnPropertySymbols(value).length > 0) throw new Error('Symbol properties are not supported in report data.')
  parents.add(value)
  for (const child of Object.values(value)) {
    validateValue(child, parents)
  }
  parents.delete(value)
}

export function getRowKey(row: ReportRow): string {
  let key = rowKeys.get(row)
  if (!key) {
    key = `record-${++nextRowKey}`
    rowKeys.set(row, key)
  }
  return key
}

export function createRecordsDataSource(records: readonly ReportRow[]) {
  if (!Array.isArray(records)) throw new Error('Supply an array of record objects.')
  validateValue(records, new Set())
  const paths = new Map<string, string[]>()
  const arrayPaths = new Set<string>()

  function discoverFields(record: ReportRow, parent: string[] = []): void {
    for (const [key, value] of Object.entries(record)) {
      const path = [...parent, key]
      const reference = formatFieldPath(path)
      if (Array.isArray(value)) arrayPaths.add(reference)
      else if (value !== null && typeof value === 'object' && !(value instanceof Date)) {
        discoverFields(value as ReportRow, path)
      } else if (!paths.has(reference)) paths.set(reference, path)
    }
  }

  for (const [index, record] of records.entries()) {
    if (!record || typeof record !== 'object' || Array.isArray(record) || record instanceof Date) {
      throw new Error(`Row ${index + 1} must be a record object.`)
    }
    discoverFields(record)
  }
  const schema: SchemaField[] = Array.from(paths).filter(([key]) => !arrayPaths.has(key)).map(([key, path], index) => ({
    id: `field-${index + 1}`, key, path, label: key,
    dataType: guessDataType(records.map((record) => readFieldPath(record, path))),
  }))
  // Host objects are kept as-is so their render keys and cached values survive a
  // re-render; only an object repeated in the list is copied to get its own key.
  const seen = new Set<ReportRow>()
  const rows = records.map((record) => {
    if (!seen.has(record)) {
      seen.add(record)
      return record
    }
    return { ...record }
  })
  // Fields holding a list (several entries per row) can't fill one cell, so
  // they're left out and named for the editor.
  const skippedFields = [...arrayPaths]
  return { getReportRows: () => rows, getSchema: () => schema, getSkippedFields: () => skippedFields }
}
