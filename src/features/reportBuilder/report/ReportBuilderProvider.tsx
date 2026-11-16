import { useId, type ReactNode } from 'react'
import { ElementIdPrefixContext } from '../../../shared/hooks/useElementId'
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
  // One ID prefix per builder, so two builders on a page don't share element IDs.
  const idPrefix = `fr-${useId().replace(/[^a-zA-Z0-9_-]/g, '')}`
  return (
    <ElementIdPrefixContext.Provider value={idPrefix}>
      <ReportBuilderContext.Provider value={core}>{children}</ReportBuilderContext.Provider>
    </ElementIdPrefixContext.Provider>
  )
}

export default ReportBuilderProvider
