import { describe, expect, it } from 'vitest'
import type { DisplayType, ReportField } from '../../../../services/reportDefinition/types'
import { getSourceChangePatch } from './columnDraft'

const typeBySource: Record<string, DisplayType> = { region: 'string', store: 'string', price: 'currency', units: 'decimal' }
const getPreferredDisplayType = (sourceKey: string) => typeBySource[sourceKey] ?? 'string'

// A customized currency column: shown as a plain number, averaged.
const priceColumn: ReportField = { id: 'c1', label: 'Price', sourceKey: 'price', displayType: 'number', aggregation: 'avg' }

describe('getSourceChangePatch', () => {
  it('switches to the new type defaults when the source type changes', () => {
    expect(getSourceChangePatch({ draft: priceColumn, nextSourceKey: 'region', getPreferredDisplayType }))
      .toEqual({ sourceKey: 'region', displayType: 'string', aggregation: 'distinct' })
  })

  it('keeps the column settings when the source type is the same', () => {
    const textColumn: ReportField = { ...priceColumn, sourceKey: 'region', displayType: 'string', aggregation: 'none' }
    expect(getSourceChangePatch({ draft: textColumn, nextSourceKey: 'store', getPreferredDisplayType })).toEqual({ sourceKey: 'store' })
  })
})
