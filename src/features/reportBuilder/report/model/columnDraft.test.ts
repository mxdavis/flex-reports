import { describe, expect, it } from 'vitest'
import type { DisplayType, ReportField } from '../../../../services/reportDefinition/types'
import { getSourceChangePatch } from './columnDraft'

const typeBySource: Record<string, DisplayType> = { region: 'string', store: 'string', price: 'currency', units: 'decimal' }

// A customized currency column: shown as a plain number, averaged.
const original: ReportField = { id: 'c1', label: 'Price', sourceKey: 'price', displayType: 'number', aggregation: 'avg' }

function patchFor(nextSourceKey: string, draft: ReportField = original) {
  return getSourceChangePatch({
    draft,
    original,
    nextSourceKey,
    isKnownSource: (sourceKey) => sourceKey in typeBySource,
    getPreferredDisplayType: (sourceKey) => typeBySource[sourceKey] ?? 'string',
  })
}

describe('getSourceChangePatch', () => {
  it('switches to the new type defaults when the source type changes', () => {
    expect(patchFor('region')).toEqual({ sourceKey: 'region', displayType: 'string', aggregation: 'distinct' })
  })

  it('keeps the column settings when the source type is the same', () => {
    const textColumn: ReportField = { ...original, sourceKey: 'region', displayType: 'string', aggregation: 'none' }
    const patch = getSourceChangePatch({
      draft: textColumn,
      original: textColumn,
      nextSourceKey: 'store',
      isKnownSource: (sourceKey) => sourceKey in typeBySource,
      getPreferredDisplayType: (sourceKey) => typeBySource[sourceKey] ?? 'string',
    })
    expect(patch).toEqual({ sourceKey: 'store' })
  })

  it('only updates the key while a source is still being typed', () => {
    expect(patchFor('pri')).toEqual({ sourceKey: 'pri' })
  })

  it('compares against the original source while the draft holds a partial key', () => {
    // Typing "pri" then back to "price": same type as the original, so the
    // customized display and total type survive.
    expect(patchFor('price', { ...original, sourceKey: 'pri' })).toEqual({ sourceKey: 'price' })
  })
})
