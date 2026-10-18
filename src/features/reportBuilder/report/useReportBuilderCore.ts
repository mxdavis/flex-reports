import { ALL_EXPORT_FORMATS, DEFAULT_MAX_VISIBLE_ROWS, MAX_VERTICAL_VIEW_ROWS } from '../config'
import { useReportBuilderComputed } from './model/useReportBuilderComputed'
import { useReportBuilderState, type ReportBuilderStateArgs } from './model/useReportBuilderState'

// Runs the builder once: state and derived data. The provider shares it
// through context; each section's props hook (model/use*Props) holds that
// section's actions and reads only what it needs.
export function useReportBuilderCore(args: ReportBuilderStateArgs) {
  const state = useReportBuilderState(args)

  // Vertical view is only offered for small reports. A report saved vertical
  // shows horizontally once its data is too big; the saved setting is kept.
  const isVerticalViewAvailable = state.rows.length <= MAX_VERTICAL_VIEW_ROWS
  const tableOrientation = isVerticalViewAvailable ? state.ui.tableOrientation : 'horizontal'

  const computed = useReportBuilderComputed({
    rows: state.rows,
    sourceColumns: state.sourceColumns,
    reportFields: state.fields,
    formulas: state.formulas,
    currencySymbol: state.currencySymbol,
    tableOrientation,
    showTips: state.showTips,
  })

  return {
    state,
    computed,
    isVerticalViewAvailable,
    maxVisibleRows: args.maxVisibleRows ?? DEFAULT_MAX_VISIBLE_ROWS,
    exportFormats: args.exports === false ? [] : Array.isArray(args.exports) ? args.exports : ALL_EXPORT_FORMATS,
  }
}

export type ReportBuilderCore = ReturnType<typeof useReportBuilderCore>
