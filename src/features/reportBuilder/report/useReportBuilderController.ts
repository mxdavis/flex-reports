import { useReportBuilderModel } from './useReportBuilderModel'
import type { ReportBuilderStateArgs } from './model/useReportBuilderState'

export function useReportBuilderController(args: ReportBuilderStateArgs) {
  return useReportBuilderModel(args)
}
