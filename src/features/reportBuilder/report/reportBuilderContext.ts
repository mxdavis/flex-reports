import { createContext } from 'react'
import type { ReportBuilderCore } from './useReportBuilderCore'

export const ReportBuilderContext = createContext<ReportBuilderCore | null>(null)
