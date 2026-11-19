import { getDefaultAggregation } from '../../../../services/reportDefinition/displayType'
import type { DisplayType, ReportField } from '../../../../services/reportDefinition/types'

type SourceChangeArgs = {
  draft: ReportField
  nextSourceKey: string
  getPreferredDisplayType: (sourceKey: string) => DisplayType
}

// Picking a source of a different type (text → currency) switches the draft to
// that type's display and total defaults; the same type keeps what's there.
// The form shows the result, and Save stores the draft as-is.
export function getSourceChangePatch({ draft, nextSourceKey, getPreferredDisplayType }: SourceChangeArgs): Partial<ReportField> {
  const nextDisplayType = getPreferredDisplayType(nextSourceKey)
  if (nextDisplayType === getPreferredDisplayType(draft.sourceKey)) return { sourceKey: nextSourceKey }

  return {
    sourceKey: nextSourceKey,
    displayType: nextDisplayType,
    aggregation: getDefaultAggregation(nextDisplayType),
  }
}
