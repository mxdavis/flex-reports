import type { ReportRow } from '../../../services/adapters'
import type { DisplayType, ReportField } from '../../../services/reportDefinition/types'

type PivotSubgroup = {
  secondaryValue: string
  rows: ReportRow[]
}

export type PivotGroup = {
  primaryValue: string
  rows: ReportRow[]
  subgroups: PivotSubgroup[]
}

type BuildEmbeddedPivotGroupsArgs = {
  previewRows: ReportRow[]
  primaryField: ReportField
  secondaryField: ReportField
  getMappedValue: (row: ReportRow, sourceKey: string, displayType: DisplayType, currencySymbol?: string) => string
}

export function buildEmbeddedPivotGroups({
  previewRows,
  primaryField,
  secondaryField,
  getMappedValue,
}: BuildEmbeddedPivotGroupsArgs): PivotGroup[] {
  const groupsByPrimary = new Map<string, {
    rows: ReportRow[]
    subgroups: PivotSubgroup[]
    subgroupBySecondary: Map<string, PivotSubgroup>
  }>()

  for (const row of previewRows) {
    const primaryValue = getMappedValue(
      row,
      primaryField.sourceKey,
      primaryField.displayType,
      primaryField.currencySymbol,
    )
    const secondaryValue = getMappedValue(
      row,
      secondaryField.sourceKey,
      secondaryField.displayType,
      secondaryField.currencySymbol,
    )

    let group = groupsByPrimary.get(primaryValue)
    if (!group) {
      group = {
        rows: [],
        subgroups: [],
        subgroupBySecondary: new Map(),
      }
      groupsByPrimary.set(primaryValue, group)
    }

    group.rows.push(row)

    let subgroup = group.subgroupBySecondary.get(secondaryValue)
    if (!subgroup) {
      subgroup = { secondaryValue, rows: [] }
      group.subgroupBySecondary.set(secondaryValue, subgroup)
      group.subgroups.push(subgroup)
    }

    subgroup.rows.push(row)
  }

  return Array.from(groupsByPrimary.entries()).map(([primaryValue, group]) => ({
    primaryValue,
    rows: group.rows,
    subgroups: group.subgroups,
  }))
}
