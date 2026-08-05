import { formatCellValue } from '../../utils/reportBuilder'
import type { ReportRow } from '../../services/adapters'
import type {
  ChipAggregationMode,
  DisplayType,
  ReportField,
} from '../../services/reportDefinition/types'

const INTEGER_NUMBER_FORMAT = new Intl.NumberFormat('en-US')

type SummaryItem = {
  label: string
  value: string
}

type BuildSummaryItemsParams = {
  fields: ReportField[]
  rows: ReportRow[]
  currencySymbol: string
  resolveChipAggregation: (field: ReportField) => ChipAggregationMode
  getChipAggregationLabel: (chipAggregation: ChipAggregationMode, displayType: DisplayType) => string
  getMappedValue: (row: ReportRow, sourceKey: string, displayType: DisplayType, currencySymbol?: string) => string
  getMappedNumericValue: (row: ReportRow, sourceKey: string) => number | null
}

export function buildSummaryItems({
  fields,
  rows,
  currencySymbol,
  resolveChipAggregation,
  getChipAggregationLabel,
  getMappedValue,
  getMappedNumericValue,
}: BuildSummaryItemsParams): SummaryItem[] {
  return fields.map((field) => {
    if (field.chipAggregation === 'none') {
      return null
    }

    const chipAggregation = resolveChipAggregation(field)
    const aggregationLabel = getChipAggregationLabel(chipAggregation, field.displayType)

    if (chipAggregation === 'count') {
      return {
        label: `${field.label} (${aggregationLabel})`,
        value: INTEGER_NUMBER_FORMAT.format(rows.length),
      }
    }

    if (chipAggregation === 'distinct') {
      const uniqueValues = new Set<string>()
      for (const row of rows) {
        const mapped = getMappedValue(row, field.sourceKey, field.displayType, field.currencySymbol)
        const normalizedValue = mapped.trim()
        if (normalizedValue.length > 0) {
          uniqueValues.add(normalizedValue)
        }
      }

      return {
        label: `${field.label} (${aggregationLabel})`,
        value: INTEGER_NUMBER_FORMAT.format(uniqueValues.size),
      }
    }

    let total = 0
    let count = 0
    let hasNumericValue = false
    let hasInvalidValue = false

    for (const row of rows) {
      const numeric = getMappedNumericValue(row, field.sourceKey)
      if (numeric === null) {
        continue
      }

      if (Number.isNaN(numeric)) {
        hasInvalidValue = true
        break
      }

      total += numeric
      count += 1
      hasNumericValue = true
    }

    if (hasInvalidValue) {
      return {
        label: `${field.label} (${aggregationLabel})`,
        value: 'Invalid formula',
      }
    }

    if (!hasNumericValue) {
      return {
        label: `${field.label} (${aggregationLabel})`,
        value: '0',
      }
    }

    const aggregatedValue = chipAggregation === 'avg' ? total / count : total

    return {
      label: `${field.label} (${aggregationLabel})`,
      value: formatCellValue(
        aggregatedValue,
        field.displayType === 'string' || field.displayType === 'date' ? 'decimal' : field.displayType,
        { currencySymbol },
      ),
    }
  }).filter((item): item is SummaryItem => item !== null)
}
