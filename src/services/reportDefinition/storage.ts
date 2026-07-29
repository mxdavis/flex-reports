import type {
  DisplayType,
  ReportData,
  ReportField,
  SourceColumn,
} from './types'

export const REPORT_DATA_STORAGE_KEY = 'flex-reports.reportData.v4'
const REPORT_DATA_VERSION = 4

function getDefaultDisplayType(sourceKey: SourceColumn['key']): DisplayType {
  if (sourceKey === 'rate' || sourceKey === 'total') {
    return 'currency'
  }

  if (sourceKey === 'hours') {
    return 'decimal'
  }

  if (sourceKey === 'workDate') {
    return 'date'
  }

  return 'string'
}

function isDisplayType(value: unknown): value is DisplayType {
  return value === 'currency'
    || value === 'decimal'
    || value === 'percent'
    || value === 'date'
    || value === 'string'
}

const defaultFields: ReportField[] = [
  { id: 'date', label: 'workDate', sourceKey: 'workDate', displayType: 'date' },
  { id: 'people', label: 'personName', sourceKey: 'personName', displayType: 'string' },
  { id: 'clients', label: 'clientName', sourceKey: 'clientName', displayType: 'string' },
  { id: 'task', label: 'task', sourceKey: 'task', displayType: 'string' },
  { id: 'hours', label: 'hours', sourceKey: 'hours', displayType: 'decimal' },
  { id: 'rate', label: 'rate', sourceKey: 'rate', displayType: 'currency' },
  { id: 'total', label: 'total', sourceKey: 'total', displayType: 'currency' },
]

export function generateDefaultReportData(sourceColumns: SourceColumn[]): ReportData {
  const fallbackSourceKey = sourceColumns[0]?.key ?? 'workDate'

  const fields = defaultFields.map((field, index) => {
    const fallback = sourceColumns[index]
    const sourceKey = sourceColumns.some((column) => column.key === field.sourceKey)
      ? field.sourceKey
      : (fallback?.key ?? fallbackSourceKey)

    return {
      ...field,
      sourceKey,
      label: sourceKey,
      displayType: getDefaultDisplayType(sourceKey),
    }
  })

  return {
    version: REPORT_DATA_VERSION,
    fields,
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

    const parsed = JSON.parse(raw) as Partial<ReportData> & { version?: number }
    if (
      (parsed.version !== 3 && parsed.version !== REPORT_DATA_VERSION)
      || !Array.isArray(parsed.fields)
    ) {
      return fallback
    }

    const safeSourceKeys = new Set(sourceColumns.map((column) => column.key))

    const fields = parsed.fields
      .filter((field): field is ReportField => {
        return Boolean(
          field
          && typeof field.id === 'string'
          && typeof field.label === 'string'
          && typeof field.sourceKey === 'string',
        )
      })
      .map((field, index) => {
        const defaultField = fallback.fields[index] ?? fallback.fields[0]
        const sourceKey = safeSourceKeys.has(field.sourceKey)
          ? field.sourceKey
          : defaultField.sourceKey

        return {
          id: field.id,
          label: field.label.trim().length > 0 ? field.label : sourceKey,
          sourceKey,
          displayType: isDisplayType(field.displayType)
            ? field.displayType
            : getDefaultDisplayType(sourceKey),
        }
      })

    if (fields.length === 0) {
      return fallback
    }

    return {
      version: REPORT_DATA_VERSION,
      fields,
    }
  } catch {
    return fallback
  }
}

export function saveReportData(reportData: ReportData): void {
  if (typeof window === 'undefined') {
    return
  }

  try {
    window.localStorage.setItem(REPORT_DATA_STORAGE_KEY, JSON.stringify(reportData))
  } catch {
    // Write failures can happen in private mode or when storage is full.
  }
}
