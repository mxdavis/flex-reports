import { getDefaultAggregation } from '../../../../services/reportDefinition/displayType'
import type { DisplayType, ReportField } from '../../../../services/reportDefinition/types'

type SourceChangeArgs = {
  draft: ReportField
  original: ReportField
  nextSourceKey: string
  isKnownSource: (sourceKey: string) => boolean
  getPreferredDisplayType: (sourceKey: string) => DisplayType
}

// Picking a source of a different type (text → currency) switches the draft to
// that type's display and total defaults; the same type keeps what's there.
// While a source is still being typed (not a known source yet), only the key
// changes. The form shows the result, and Save stores the draft as-is.
export function getSourceChangePatch({
  draft,
  original,
  nextSourceKey,
  isKnownSource,
  getPreferredDisplayType,
}: SourceChangeArgs): Partial<ReportField> {
  if (!isKnownSource(nextSourceKey)) return { sourceKey: nextSourceKey }

  const previousSourceKey = isKnownSource(draft.sourceKey) ? draft.sourceKey : original.sourceKey
  const nextDisplayType = getPreferredDisplayType(nextSourceKey)
  if (nextDisplayType === getPreferredDisplayType(previousSourceKey)) return { sourceKey: nextSourceKey }

  return {
    sourceKey: nextSourceKey,
    displayType: nextDisplayType,
    aggregation: getDefaultAggregation(nextDisplayType),
  }
}
