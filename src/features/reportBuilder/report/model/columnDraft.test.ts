import { describe, expect, it } from 'vitest'
import type { DisplayType, ReportField } from '../../../../services/reportDefinition/types'
import { getSourceChangePatch } from './columnDraft'

const typeBySource: Record<string, DisplayType> = { region: 'string', store: 'string', price: 'currency', units: 'decimal' }
const getPreferredDisplayType = (sourceKey: string) => typeBySource[sourceKey] ?? 'string'
const getSourceLabel = (sourceKey: string) => sourceKey.charAt(0).toUpperCase() + sourceKey.slice(1)
const helpers = { getPreferredDisplayType, getSourceLabel }

// A customized currency column: shown as a plain number, averaged.
const priceColumn: ReportField = { id: 'c1', label: 'Price', sourceKey: 'price', displayType: 'number', aggregation: 'avg' }

describe('getSourceChangePatch', () => {
  it('switches to the new type defaults when the source type changes', () => {
    expect(getSourceChangePatch({ draft: priceColumn, nextSourceKey: 'region', ...helpers }))
      .toEqual({ sourceKey: 'region', label: 'Region', displayType: 'string', aggregation: 'distinct' })
  })

  it('keeps the column settings when the source type is the same', () => {
    const textColumn: ReportField = { ...priceColumn, sourceKey: 'region', displayType: 'string', aggregation: 'none' }
    // "Price" isn't region's name, so it's a title the editor typed: kept.
    expect(getSourceChangePatch({ draft: textColumn, nextSourceKey: 'store', ...helpers })).toEqual({ sourceKey: 'store' })
  })

  it('updates a title that is still the previous source\'s name', () => {
    expect(getSourceChangePatch({ draft: priceColumn, nextSourceKey: 'units', ...helpers })).toMatchObject({ label: 'Units' })
  })

  it('keeps a title the editor typed', () => {
    expect(getSourceChangePatch({ draft: { ...priceColumn, label: 'Unit price' }, nextSourceKey: 'units', ...helpers }))
      .not.toHaveProperty('label')
  })

  it('fills a blank title from the new source', () => {
    expect(getSourceChangePatch({ draft: { ...priceColumn, sourceKey: '', label: ' ' }, nextSourceKey: 'units', ...helpers }))
      .toMatchObject({ label: 'Units' })
  })
})
