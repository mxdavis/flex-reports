import type { ReportBuilderOptions } from '../types'
import { useReportBuilderModel } from './useReportBuilderModel'

export function useReportBuilderController(options: ReportBuilderOptions) {
  return useReportBuilderModel(options)
}
