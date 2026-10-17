import type { ReactNode } from 'react'
import type { ReportBuilderStateArgs } from './model/useReportBuilderState'
import { ReportBuilderContext } from './reportBuilderContext'
import { useReportBuilderCore } from './useReportBuilderCore'

type ReportBuilderProviderProps = {
  args: ReportBuilderStateArgs
  children: ReactNode
}

// Runs the builder once and shares it with every section through context.
function ReportBuilderProvider({ args, children }: ReportBuilderProviderProps) {
  const core = useReportBuilderCore(args)
  return <ReportBuilderContext.Provider value={core}>{children}</ReportBuilderContext.Provider>
}

export default ReportBuilderProvider
