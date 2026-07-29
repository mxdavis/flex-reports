import type { ReportData, ReportField, SourceColumn } from './types'

export const REPORT_DATA_STORAGE_KEY = 'flex-reports.reportData.v2'
const REPORT_DATA_VERSION = 2

const defaultFields: ReportField[] = [
  { id: 'date', label: 'column1', columnId: 'column1' },
  { id: 'people', label: 'column2', columnId: 'column2' },
  { id: 'clients', label: 'column3', columnId: 'column3' },
  { id: 'task', label: 'column4', columnId: 'column4' },
  { id: 'hours', label: 'column5', columnId: 'column5' },
  { id: 'rate', label: 'column6', columnId: 'column6' },
  { id: 'total', label: 'column7', columnId: 'column7' },
]

export function generateDefaultReportData(sourceColumns: SourceColumn[]): ReportData {
  const columnLabels = sourceColumns.reduce<Record<string, string>>((memo, column) => {
    memo[column.id] = column.defaultLabel
    return memo
  }, {})

  const fields = defaultFields.map((field, index) => {
    const fallback = sourceColumns[index]
    return {
      ...field,
      columnId: sourceColumns.some((column) => column.id === field.columnId)
        ? field.columnId
        : (fallback?.id ?? sourceColumns[0]?.id ?? field.columnId),
    }
  })

  return {
    version: REPORT_DATA_VERSION,
    fields,
    columnLabels,
  }
}

export function loadReportData(sourceColumns: SourceColumn[]): ReportData {
  const fallback = generateDefaultReportData(sourceColumns)

  if (typeof window === 'undefined') {
    return fallback
  }

  try {
    const raw = window.localStorage.getItem(REPORT_DATA_STORAGE_KEY)
    if (!raw) {
      return fallback
    }

    const parsed = JSON.parse(raw) as Partial<ReportData>
    if (parsed.version !== REPORT_DATA_VERSION || !Array.isArray(parsed.fields)) {
      return fallback
    }

    const safeFieldIds = new Set(sourceColumns.map((column) => column.id))

    const fields = parsed.fields
      .filter((field): field is ReportField => {
        return Boolean(
          field
          && typeof field.id === 'string'
          && typeof field.label === 'string'
          && typeof field.columnId === 'string',
        )
      })
      .map((field, index) => {
        const defaultField = fallback.fields[index] ?? fallback.fields[0]
        const columnId = safeFieldIds.has(field.columnId)
          ? field.columnId
          : defaultField.columnId

        return {
          id: field.id,
          label: field.label,
          columnId,
        }
      })

    if (fields.length === 0) {
      return fallback
    }

    const parsedLabels = parsed.columnLabels ?? {}
    const columnLabels = { ...fallback.columnLabels }
    for (const column of sourceColumns) {
      const label = parsedLabels[column.id]
      if (typeof label === 'string' && label.trim().length > 0) {
        columnLabels[column.id] = label
      }
    }

    return {
      version: REPORT_DATA_VERSION,
      fields,
      columnLabels,
    }
  } catch {
    return fallback
  }
}

export function saveReportData(reportData: ReportData): void {
  if (typeof window === 'undefined') {
    return
  }

  window.localStorage.setItem(REPORT_DATA_STORAGE_KEY, JSON.stringify(reportData))
}
