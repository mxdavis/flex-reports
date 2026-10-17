import { useEffect } from 'react'
import SideArrowIcon from '../../../shared/icons/SideArrowIcon'
import UpDownArrowIcon from '../../../shared/icons/UpDownArrowIcon'
import HintedButton from '../../../shared/components/HintedButton'
import { getTreeLayout, joinFieldLabels, type OutlineRowCounts } from '../report/model/pivotLayout'
import ReportTableContent, { type ReportTableContentProps } from '../sections/ReportTableContent'
import './ReportTableSection.css'

export type ReportTableSectionProps = ReportTableContentProps & {
  sheetName: string
  isTableFullscreen: boolean
  // The Grouping button is pressed (grouping is on, in horizontal view).
  isGroupingOn: boolean
  // The level actually shown, after the maxVisibleRows cap.
  expandedLevels: number | null
  outlineRowCounts: OutlineRowCounts
  maxVisibleRows: number
  isOutlineCapped: boolean
  isVerticalViewAvailable: boolean
  maxVerticalViewRows: number
  showTips: boolean
  onToggleTotals: () => void
  onToggleGrouping: () => void
  onExpandedLevelsChange: (value: number | null) => void
  onToggleOrientation: () => void
  onToggleFullscreen: () => void
}

const ALL_ROWS = 'all'

function ReportTableSection({
  sheetName,
  isTableFullscreen,
  isGroupingOn,
  expandedLevels,
  outlineRowCounts,
  maxVisibleRows,
  isOutlineCapped,
  isVerticalViewAvailable,
  maxVerticalViewRows,
  showTips,
  onToggleTotals,
  onToggleGrouping,
  onExpandedLevelsChange,
  onToggleOrientation,
  onToggleFullscreen,
  ...tableProps
}: ReportTableSectionProps) {
  const { isHorizontalTable, isGrouped, showTotals, fields } = tableProps
  // Outline levels, like Excel's 1/2/3 buttons: show groups down to a column.
  const groupLevelCount = getTreeLayout(fields).groupCount
  // Levels that would show more than maxVisibleRows rows can't be picked.
  const formatCount = (count: number) => count.toLocaleString('en-US')
  const outlineOptions = [
    ...Array.from({ length: groupLevelCount }, (_, level) => ({
      value: String(level),
      label: joinFieldLabels(fields.slice(0, level + 1)),
      rowCount: outlineRowCounts.byLevel[level] ?? 0,
    })),
    { value: ALL_ROWS, label: 'All rows', rowCount: outlineRowCounts.all },
  ].map((option) => ({ ...option, isOverLimit: option.rowCount > maxVisibleRows }))
  const groupingTitle = showTips
    ? 'Tip: groups by each column from the left. The last text column before your numbers names each row, '
      + 'and number columns are values. Set a column\'s Total type in edit mode to choose how it adds up.'
    : 'Group rows, with totals for each group.'
  // expandedLevels arrives normalized: null means everything is open.
  const outlineValue = expandedLevels === null ? ALL_ROWS : String(expandedLevels)

  useEffect(() => {
    if (!isTableFullscreen) {
      return
    }

    document.body.classList.add('fr-fullscreen-lock')
    return () => {
      document.body.classList.remove('fr-fullscreen-lock')
    }
  }, [isTableFullscreen])

  return (
    <section
      id="fr-report-table"
      className={isTableFullscreen ? 'fr-report-table fr-jump-target fr-fullscreen' : 'fr-report-table fr-jump-target'}
    >
      <div className="fr-report-table-header">
        <h2>{sheetName}</h2>
        <div className="fr-report-table-actions">
          <HintedButton
            isPressed={isHorizontalTable && showTotals}
            onClick={onToggleTotals}
            title="Show totals. Each column totals by its own Total type setting."
            disabledReason={isHorizontalTable ? undefined : 'Totals are available in horizontal view.'}
          >
            Totals
          </HintedButton>
          <HintedButton
            isPressed={isGroupingOn}
            onClick={onToggleGrouping}
            title={groupingTitle}
            disabledReason={isHorizontalTable ? undefined : 'Switch to horizontal view to use grouping.'}
          >
            Grouping
          </HintedButton>
          {isGrouped && (
            <select
              aria-label="Show rows"
              value={outlineValue}
              title="Choose how far groups open. Click a group's arrow to open or close just that group."
              onChange={(event) => {
                onExpandedLevelsChange(event.target.value === ALL_ROWS ? null : Number(event.target.value))
              }}
            >
              {outlineOptions.map((option) => (
                <option key={option.value} value={option.value} disabled={option.isOverLimit && option.value !== outlineValue}>
                  {option.isOverLimit ? `${option.label} (over ${formatCount(maxVisibleRows)} rows)` : option.label}
                </option>
              ))}
            </select>
          )}
          <HintedButton
            onClick={onToggleOrientation}
            title={isHorizontalTable ? 'Switch to vertical view' : 'Switch to horizontal view'}
            disabledReason={isHorizontalTable && !isVerticalViewAvailable
              ? `Vertical view is available for up to ${formatCount(maxVerticalViewRows)} rows. `
                + `This report has ${formatCount(tableProps.rows.length)}.`
              : undefined}
          >
            {isHorizontalTable ? <UpDownArrowIcon /> : <SideArrowIcon />}
            <span>{isHorizontalTable ? 'Vertical view' : 'Horizontal view'}</span>
          </HintedButton>
          <button
            type="button"
            onClick={onToggleFullscreen}
            title={isTableFullscreen ? 'Exit expanded view' : 'Expand table to full screen'}
          >
            {isTableFullscreen ? 'Exit full screen' : 'Full screen'}
          </button>
        </div>
      </div>
      {isGrouped && isOutlineCapped && (
        <p className="fr-outline-note" role="note">
          This report has {formatCount(outlineRowCounts.all)} rows fully expanded, more than
          the {formatCount(maxVisibleRows)}-row limit, so it opens
          at <strong>{outlineOptions.find((option) => option.value === outlineValue)?.label}</strong>.
          Open any group to see its rows.
        </p>
      )}
      <div
        className="fr-report-table-scroll"
        role="region"
        aria-label="Report table"
        ref={tableProps.scrollContainerRef}
      >
        <table>
          <ReportTableContent {...tableProps} />
        </table>
      </div>
    </section>
  )
}

export default ReportTableSection
