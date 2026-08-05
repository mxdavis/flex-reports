import type { ReportBuilderAppProps } from '../types'
import { useReportBuilderModel } from './useReportBuilderModel'

export function useReportBuilderController({
  initialTableOrientation,
  initialAggregateMode,
  initialEditMode,
}: Required<ReportBuilderAppProps>) {
  return useReportBuilderModel({
    initialTableOrientation,
    initialAggregateMode,
    initialEditMode,
  })
}
