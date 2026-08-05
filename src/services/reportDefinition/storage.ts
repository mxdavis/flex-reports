import type {
  ChipAggregationMode,
  DisplayType,
  ReportData,
  ReportField,
  SourceColumn,
} from './types'
import { getDefaultDisplayType } from './displayType'

export const REPORT_DATA_STORAGE_KEY = 'flex-reports.reportData.v4'
export const LEGACY_REPORT_DATA_STORAGE_KEY = 'flex-reports.reportData.v3'
const REPORT_DATA_VERSION = 4

function isDisplayType(value: unknown): value is DisplayType {
  return value === 'currency'
    || value === 'number'
    || value === 'decimal'
    || value === 'percent'
    || value === 'date'
    || value === 'string'
}

function isChipAggregationMode(value: unknown): value is ChipAggregationMode {
  return value === 'none'
    || value === 'sum'
    || value === 'avg'
    || value === 'count'
}

function getDefaultChipAggregation(displayType: DisplayType): ChipAggregationMode {
  return displayType === 'string' || displayType === 'date' ? 'count' : 'sum'
}

function getDefaultCurrencySymbol(displayType: DisplayType): string {
  return displayType === 'currency' ? '$' : ''
}

export function generateDefaultReportData(sourceColumns: SourceColumn[]): ReportData {
  const fields = sourceColumns.map((column) => {
    const sourceKey = String(column.key)
    const displayType = getDefaultDisplayType(column)

    return {
      id: column.id,
      label: column.label,
      sourceKey,
      displayType,
      chipAggregation: getDefaultChipAggregation(displayType),
      currencySymbol: getDefaultCurrencySymbol(displayType),
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
    const latestRaw = window.localStorage.getItem(REPORT_DATA_STORAGE_KEY)
    const legacyRaw = latestRaw ? null : window.localStorage.getItem(LEGACY_REPORT_DATA_STORAGE_KEY)
    const raw = latestRaw ?? legacyRaw
    const usedLegacyStorageKey = Boolean(legacyRaw)

    if (!raw) {
      return fallback
    }

    const parsed = JSON.parse(raw) as {
      version?: number
      fields?: Array<Partial<ReportField>>
    }
    if (
      (parsed.version !== 3 && parsed.version !== REPORT_DATA_VERSION)
      || !Array.isArray(parsed.fields)
    ) {
      return fallback
    }

    const sourceColumnByKey = new Map(sourceColumns.map((column) => [String(column.key), column]))

    const fields = parsed.fields
      .filter((field): field is Pick<ReportField, 'id' | 'label' | 'sourceKey'> & Partial<ReportField> => {
        return Boolean(
          field
          && typeof field.id === 'string'
          && typeof field.label === 'string'
          && typeof field.sourceKey === 'string',
        )
      })
      .map((field, index) => {
        const defaultField = fallback.fields[index] ?? fallback.fields[0]
        const sourceKey = field.sourceKey.trim().length > 0
          ? field.sourceKey
          : defaultField.sourceKey
        const source = sourceColumnByKey.get(sourceKey)
        const resolvedDisplayType = isDisplayType(field.displayType)
          ? field.displayType
          : getDefaultDisplayType(source ?? { key: sourceKey, dataType: 'string' })

        return {
          id: field.id,
          label: field.label.trim().length > 0 ? field.label : sourceKey,
          sourceKey,
          displayType: resolvedDisplayType,
          chipAggregation: isChipAggregationMode(field.chipAggregation)
            ? field.chipAggregation
            : getDefaultChipAggregation(resolvedDisplayType),
          currencySymbol: typeof field.currencySymbol === 'string'
            ? field.currencySymbol
            : getDefaultCurrencySymbol(resolvedDisplayType),
        }
      })

    if (fields.length === 0) {
      return fallback
    }

    const loadedReportData: ReportData = {
      version: REPORT_DATA_VERSION,
      fields,
    }

    if (usedLegacyStorageKey) {
      saveReportData(loadedReportData)
      try {
        window.localStorage.removeItem(LEGACY_REPORT_DATA_STORAGE_KEY)
      } catch {
        // Ignore cleanup failures when legacy key cannot be removed.
      }
    }

    return loadedReportData
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
