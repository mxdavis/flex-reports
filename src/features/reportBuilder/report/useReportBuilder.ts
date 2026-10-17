import { useContext } from 'react'
import { ReportBuilderContext } from './reportBuilderContext'
import type { ReportBuilderCore } from './useReportBuilderCore'

// State, derived data, and actions for the report builder. Must be used inside
// ReportBuilderProvider.
export function useReportBuilder(): ReportBuilderCore {
  const core = useContext(ReportBuilderContext)
  if (!core) throw new Error('useReportBuilder must be used inside ReportBuilderProvider.')
  return core
}
