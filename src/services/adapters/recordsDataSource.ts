import type { ReportRow, SchemaField } from './types'

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
  const keys = new Set<string>()
  for (const [index, record] of records.entries()) {
    if (!record || typeof record !== 'object' || Array.isArray(record) || record instanceof Date) {
      throw new Error(`Row ${index + 1} must be a record object.`)
    }
    for (const key of Object.keys(record)) keys.add(key)
  }
  const schema: SchemaField[] = Array.from(keys, (key, index) => ({
    id: `field-${index + 1}`, key, label: key, dataType: 'string',
  }))
  const rows = records.map((record) => ({ ...record }))
  return { getReportRows: () => rows, getSchema: () => schema }
}
