import { useEffect, type RefObject } from 'react'
import SideArrowIcon from '../../../shared/icons/SideArrowIcon'
import UpDownArrowIcon from '../../../shared/icons/UpDownArrowIcon'
import { getGroupLevelCount } from '../report/model/sampleRowsPivot'
import SampleRowsTableContent, { type SampleRowsTableContentProps } from '../sections/SampleRowsTableContent'
import './SampleRowsSection.css'

export type SampleRowsSectionProps = SampleRowsTableContentProps & {
  sheetName: string
  isTableFullscreen: boolean
  expandedLevels: number | null
  showTips: boolean
  tableScrollRef: RefObject<HTMLDivElement | null>
  onToggleTotals: () => void
  onToggleGrouping: () => void
  onExpandedLevelsChange: (value: number | null) => void
  onToggleOrientation: () => void
  onToggleFullscreen: () => void
}

const ALL_ROWS = 'all'

function SampleRowsSection({
  sheetName,
  isTableFullscreen,
  expandedLevels,
  showTips,
  tableScrollRef,
  onToggleTotals,
  onToggleGrouping,
  onExpandedLevelsChange,
  onToggleOrientation,
  onToggleFullscreen,
  ...tableProps
}: SampleRowsSectionProps) {
  const { isHorizontalTable, isGroupingEnabled, showTotals, fields } = tableProps
  const isGroupingUnavailable = !isHorizontalTable
  const isGroupingActive = isHorizontalTable && isGroupingEnabled
  // Outline levels, like Excel's 1/2/3 buttons: show groups down to a column.
  const groupLevelCount = getGroupLevelCount(fields)
  const outlineOptions = Array.from({ length: groupLevelCount }, (_, level) => ({
    value: String(level),
    label: fields.slice(0, level + 1).map((field) => field.label).join(' › '),
  }))
  const groupingTitle = showTips
    ? 'Tip: groups by each column from the left, stopping at the first number column. '
      + 'To choose how a column adds up in group totals, set its Total type in edit mode.'
    : 'Group rows, with totals for each group.'
  const outlineValue = expandedLevels === null || expandedLevels >= groupLevelCount ? ALL_ROWS : String(expandedLevels)

  useEffect(() => {
    if (!isTableFullscreen) {
      return
    }

    document.body.classList.add('seed-table-fullscreen-lock')
    return () => {
      document.body.classList.remove('seed-table-fullscreen-lock')
    }
  }, [isTableFullscreen])

  return (
    <section
      id="report-table"
      className={`seed-table sample-rows-jump-target ${isTableFullscreen ? 'fullscreen' : ''}`}
    >
      <div className="seed-table-header">
        <h2>{sheetName}</h2>
        <div className="seed-table-actions">
          <button
            type="button"
            className="totals-toggle-button"
            aria-pressed={showTotals}
            onClick={onToggleTotals}
            title="Show totals. Each column totals by its own Total type setting."
          >
            Totals
          </button>
          <span
            className="grouping-toggle-wrapper"
            title={isGroupingUnavailable ? 'Switch to horizontal view to use grouping.' : undefined}
          >
            <button
              type="button"
              className="grouping-toggle-button"
              aria-pressed={isGroupingActive}
              disabled={isGroupingUnavailable}
              onClick={onToggleGrouping}
              title={isGroupingUnavailable ? undefined : groupingTitle}
            >
              Grouping
            </button>
          </span>
          {isGroupingActive && groupLevelCount > 0 && (
            <select
              aria-label="Show rows"
              value={outlineValue}
              title="Choose how far groups open. Click a group's arrow to open or close just that group."
              onChange={(event) => {
                onExpandedLevelsChange(event.target.value === ALL_ROWS ? null : Number(event.target.value))
              }}
            >
              {outlineOptions.map((option) => (
                <option key={option.value} value={option.value}>{option.label}</option>
              ))}
              <option value={ALL_ROWS}>All rows</option>
            </select>
          )}
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
          <SampleRowsTableContent {...tableProps} />
        </table>
      </div>
    </section>
  )
}

export default SampleRowsSection
