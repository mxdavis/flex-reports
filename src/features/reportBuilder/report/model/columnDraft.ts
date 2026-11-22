import { getDefaultAggregation } from '../../../../services/reportDefinition/displayType'
import type { DisplayType, ReportField } from '../../../../services/reportDefinition/types'

type SourceChangeArgs = {
  draft: ReportField
  nextSourceKey: string
  getPreferredDisplayType: (sourceKey: string) => DisplayType
  getSourceLabel: (sourceKey: string) => string
}

// Picking a source of a different type (text → currency) switches the draft to
// that type's display and total defaults; the same type keeps what's there.
// The title follows the source while it's blank or still the previous
// source's name; a title the editor typed is kept. The form shows the result,
// and Save stores the draft as-is.
export function getSourceChangePatch({
  draft,
  nextSourceKey,
  getPreferredDisplayType,
  getSourceLabel,
}: SourceChangeArgs): Partial<ReportField> {
  const patch: Partial<ReportField> = { sourceKey: nextSourceKey }
  const label = draft.label.trim()
  if (!label || label === getSourceLabel(draft.sourceKey)) patch.label = getSourceLabel(nextSourceKey)

  const nextDisplayType = getPreferredDisplayType(nextSourceKey)
  if (nextDisplayType !== getPreferredDisplayType(draft.sourceKey)) {
    patch.displayType = nextDisplayType
    patch.aggregation = getDefaultAggregation(nextDisplayType)
  }
  return patch
}
