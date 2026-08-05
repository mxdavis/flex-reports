import type { RefObject } from 'react'
import type { ReportRow } from '../../../services/adapters'
import type { DisplayType, ReportField } from '../../../services/reportDefinition/types'
import type { AggregateMode } from '../types'
import SideArrowIcon from '../../../shared/icons/SideArrowIcon'
import UpDownArrowIcon from '../../../shared/icons/UpDownArrowIcon'
import './SampleRowsSection.css'

type VerticalColumn = {
  key: string
  headerValue: string
  rows: ReportRow[]
}

type SampleRowsSectionProps = {
  sheetName: string
  isTableFullscreen: boolean
  isHorizontalTable: boolean
  aggregateMode: AggregateMode
  showTotals: boolean
  fields: ReportField[]
  previewRows: ReportRow[]
  verticalColumns: VerticalColumn[]
  tableScrollRef: RefObject<HTMLDivElement | null>
  onAggregateModeChange: (mode: AggregateMode) => void
  onToggleOrientation: () => void
  onToggleFullscreen: () => void
  getMappedValue: (row: ReportRow, sourceKey: string, displayType: DisplayType) => string
  getAggregatedFieldValue: (rowsToAggregate: ReportRow[], sourceKey: string, mode: AggregateMode) => number | null
  formatValue: (value: number | null, displayType: DisplayType) => string
}

function SampleRowsSection({
  sheetName,
  isTableFullscreen,
  isHorizontalTable,
  aggregateMode,
  showTotals,
  fields,
  previewRows,
  verticalColumns,
  tableScrollRef,
  onAggregateModeChange,
  onToggleOrientation,
  onToggleFullscreen,
  getMappedValue,
  getAggregatedFieldValue,
  formatValue,
}: SampleRowsSectionProps) {
  return (
    <section
      id="report-chart"
      className={`seed-table sample-rows-jump-target ${isTableFullscreen ? 'fullscreen' : ''}`}
    >
      <div className="seed-table-header">
        <h2>{sheetName}</h2>
        <div className="seed-table-actions">
          <span className="seed-table-mode">{`Mode: ${isHorizontalTable ? 'Horizontal' : 'Vertical'}`}</span>
          <label htmlFor="aggregate-mode" className="seed-table-mode">
            Aggregate
          </label>
          <select
            id="aggregate-mode"
            value={aggregateMode}
            title="Choose how totals and grouped values are calculated."
            onChange={(event) => {
              onAggregateModeChange(event.target.value as AggregateMode)
            }}
          >
            <option value="none">None</option>
            <option value="sum">Sum</option>
            <option value="avg">Average</option>
          </select>
          <button
            type="button"
            onClick={onToggleOrientation}
            title={isHorizontalTable ? 'Switch to vertical view' : 'Switch to horizontal view'}
          >
            {isHorizontalTable ? <UpDownArrowIcon /> : <SideArrowIcon />}
            <span>{isHorizontalTable ? 'Vertical view' : 'Horizontal view'}</span>
          </button>
          <button
            type="button"
            onClick={onToggleFullscreen}
            title={isTableFullscreen ? 'Exit expanded view' : 'Expand table to full screen'}
          >
            {isTableFullscreen ? 'Exit full screen' : 'Full screen'}
          </button>
        </div>
      </div>
      <div
        className="seed-table-scroll"
        role="region"
        aria-label="Sample report rows"
        ref={tableScrollRef}
      >
        <table>
          {isHorizontalTable
            ? (
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
                        )
                        return (
                          <td key={`${row.id}-${field.id}`}>{mappedValue}</td>
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
                          <td key={`total-value-${field.id}`}>
                            <strong>{formatValue(aggregatedValue, field.displayType)}</strong>
                          </td>
                        )
                      })}
                    </tr>
                  </tfoot>
                )}
              </>
            )
            : (
              <>
                <thead>
                  <tr>
                    <th title="This column label and its values form the header row in vertical view.">
                      {fields[0]?.label ?? 'Column 1'}
                    </th>
                    {verticalColumns.map((column) => {
                      return <th key={`column-view-${column.key}`}>{column.headerValue}</th>
                    })}
                    {showTotals && <th>Total</th>}
                  </tr>
                </thead>
                <tbody>
                  {fields.slice(1).map((field) => (
                    <tr key={`row-view-${field.id}`}>
                      <th>{field.label}</th>
                      {verticalColumns.map((column) => {
                        const mappedValue = column.rows.length > 1
                          ? (() => {
                            const aggregatedValue = getAggregatedFieldValue(
                              column.rows,
                              field.sourceKey,
                              aggregateMode,
                            )
                            if (aggregatedValue === null) {
                              return getMappedValue(
                                column.rows[0],
                                field.sourceKey,
                                field.displayType,
                              )
                            }

                            return formatValue(aggregatedValue, field.displayType)
                          })()
                          : getMappedValue(
                            column.rows[0],
                            field.sourceKey,
                            field.displayType,
                          )

                        return <td key={`${field.id}-${column.key}`}>{mappedValue}</td>
                      })}
                      {showTotals && (
                        <td>
                          <strong>
                            {formatValue(
                              getAggregatedFieldValue(
                                previewRows,
                                field.sourceKey,
                                aggregateMode,
                              ),
                              field.displayType,
                            )}
                          </strong>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </>
            )}
        </table>
      </div>
    </section>
  )
}

export default SampleRowsSection
