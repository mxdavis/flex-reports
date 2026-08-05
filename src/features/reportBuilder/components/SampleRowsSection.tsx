import type { RefObject } from 'react'
import type { ReportRow } from '../../../services/adapters'
import type { DisplayType, ReportField } from '../../../services/reportDefinition/types'
import type { AggregateMode } from '../types'
import SideArrowIcon from '../../../shared/icons/SideArrowIcon'
import UpDownArrowIcon from '../../../shared/icons/UpDownArrowIcon'
import SampleRowsTableContent from '../sections/SampleRowsTableContent'
import './SampleRowsSection.css'

type VerticalColumn = {
  key: string
  headerValue: string
  rows: ReportRow[]
}

export type SampleRowsSectionProps = {
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
  getMappedValue: (row: ReportRow, sourceKey: string, displayType: DisplayType, currencySymbol?: string) => string
  getAggregatedFieldValue: (rowsToAggregate: ReportRow[], sourceKey: string, mode: AggregateMode) => number | null
  formatValue: (value: number | null, displayType: DisplayType, currencySymbol?: string) => string
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
          <SampleRowsTableContent
            isHorizontalTable={isHorizontalTable}
            showTotals={showTotals}
            aggregateMode={aggregateMode}
            fields={fields}
            previewRows={previewRows}
            verticalColumns={verticalColumns}
            getMappedValue={getMappedValue}
            getAggregatedFieldValue={getAggregatedFieldValue}
            formatValue={formatValue}
          />
        </table>
      </div>
    </section>
  )
}

export default SampleRowsSection
