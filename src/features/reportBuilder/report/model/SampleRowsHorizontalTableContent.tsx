import { Fragment } from 'react'
import type { ReportRow } from '../../../../services/adapters'
import type { DisplayType, ReportField } from '../../../../services/reportDefinition/types'
import type { AggregateMode } from '../../types'
import { buildEmbeddedPivotGroups } from '../../sections/sampleRowsPivot'

type SampleRowsHorizontalTableContentProps = {
  showTotals: boolean
  aggregateMode: AggregateMode
  isGroupingEnabled: boolean
  fields: ReportField[]
  previewRows: ReportRow[]
  getMappedValue: (row: ReportRow, sourceKey: string, displayType: DisplayType, currencySymbol?: string) => string
  getAggregatedFieldValue: (rowsToAggregate: ReportRow[], sourceKey: string, mode: AggregateMode) => number | null
  formatValue: (value: number | null, displayType: DisplayType, currencySymbol?: string) => string
  isNumericDisplayType: (displayType: DisplayType) => boolean
}

export function SampleRowsHorizontalTableContent({
  showTotals,
  aggregateMode,
  isGroupingEnabled,
  fields,
  previewRows,
  getMappedValue,
  getAggregatedFieldValue,
  formatValue,
  isNumericDisplayType,
}: SampleRowsHorizontalTableContentProps) {
  const renderFieldValue = (rowsToRender: ReportRow[], field: ReportField): string => {
    if (rowsToRender.length > 1) {
      const aggregatedValue = getAggregatedFieldValue(rowsToRender, field.sourceKey, aggregateMode)
      if (aggregatedValue !== null) {
        return formatValue(aggregatedValue, field.displayType, field.currencySymbol)
      }
    }

    return getMappedValue(
      rowsToRender[0],
      field.sourceKey,
      field.displayType,
      field.currencySymbol,
    )
  }

  const shouldRenderEmbeddedPivot = isGroupingEnabled && fields.length >= 2
  if (shouldRenderEmbeddedPivot) {
    const [primaryField, secondaryField, ...metricFields] = fields
    const pivotGroups = buildEmbeddedPivotGroups({
      previewRows,
      primaryField,
      secondaryField,
      getMappedValue,
    })

    return (
      <>
        <thead>
          <tr>
            {fields.map((field) => {
              return <th key={field.id}>{field.label}</th>
            })}
          </tr>
        </thead>
        <tbody>
          {pivotGroups.map((group) => {
            return (
              <Fragment key={`group-${group.primaryValue}`}>
                {group.subgroups.map((subgroup, subgroupIndex) => {
                  return (
                    <tr key={`subgroup-${group.primaryValue}-${subgroup.secondaryValue}-${subgroupIndex}`}>
                      <th>{subgroupIndex === 0 ? group.primaryValue : ''}</th>
                      <td>{subgroup.secondaryValue}</td>
                      {metricFields.map((field) => {
                        return (
                          <td
                            key={`${group.primaryValue}-${subgroup.secondaryValue}-${field.id}`}
                            className={isNumericDisplayType(field.displayType) ? 'seed-table-value-numeric' : ''}
                          >
                            {renderFieldValue(subgroup.rows, field)}
                          </td>
                        )
                      })}
                    </tr>
                  )
                })}
                {showTotals && (
                  <tr key={`group-total-${group.primaryValue}`}>
                    <th><strong>{`${group.primaryValue} Total`}</strong></th>
                    <td><strong>{aggregateMode === 'avg' ? 'Average' : 'Total'}</strong></td>
                    {metricFields.map((field) => {
                      return (
                        <td
                          key={`group-total-${group.primaryValue}-${field.id}`}
                          className={isNumericDisplayType(field.displayType) ? 'seed-table-value-numeric' : ''}
                        >
                          <strong>{formatValue(
                            getAggregatedFieldValue(group.rows, field.sourceKey, aggregateMode),
                            field.displayType,
                            field.currencySymbol,
                          )}</strong>
                        </td>
                      )
                    })}
                  </tr>
                )}
              </Fragment>
            )
          })}
        </tbody>
        {showTotals && (
          <tfoot>
            <tr>
              <th><strong>Grand total</strong></th>
              <td><strong>{aggregateMode === 'avg' ? 'Average' : 'Total'}</strong></td>
              {metricFields.map((field) => {
                return (
                  <td
                    key={`grand-total-${field.id}`}
                    className={isNumericDisplayType(field.displayType) ? 'seed-table-value-numeric' : ''}
                  >
                    <strong>{formatValue(
                      getAggregatedFieldValue(previewRows, field.sourceKey, aggregateMode),
                      field.displayType,
                      field.currencySymbol,
                    )}</strong>
                  </td>
                )
              })}
            </tr>
          </tfoot>
        )}
      </>
    )
  }

  return (
    <>
      <thead>
        <tr>
          {fields.map((field) => {
            return <th key={field.id}>{field.label}</th>
          })}
        </tr>
      </thead>
      <tbody>
        {previewRows.map((row) => (
          <tr key={row.id}>
            {fields.map((field) => {
              const mappedValue = getMappedValue(
                row,
                field.sourceKey,
                field.displayType,
                field.currencySymbol,
              )
              return (
                <td
                  key={`${row.id}-${field.id}`}
                  className={isNumericDisplayType(field.displayType) ? 'seed-table-value-numeric' : ''}
                >
                  {mappedValue}
                </td>
              )
            })}
          </tr>
        ))}
      </tbody>
      {showTotals && fields.length > 0 && (
        <tfoot>
          <tr>
            {fields.map((field, index) => {
              if (index === 0) {
                return <th key={`total-label-${field.id}`}><strong>Total</strong></th>
              }

              const aggregatedValue = getAggregatedFieldValue(
                previewRows,
                field.sourceKey,
                aggregateMode,
              )
              return (
                <td
                  key={`total-value-${field.id}`}
                  className={isNumericDisplayType(field.displayType) ? 'seed-table-value-numeric' : ''}
                >
                  <strong>{formatValue(aggregatedValue, field.displayType, field.currencySymbol)}</strong>
                </td>
              )
            })}
          </tr>
        </tfoot>
      )}
    </>
  )
}
