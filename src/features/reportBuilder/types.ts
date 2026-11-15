import type { ReportRow, SeedFormula } from '../../services/adapters/types'
import type { ReportField } from '../../services/reportDefinition/types'

export type AggregateMode = 'none' | 'sum' | 'avg' | 'count' | 'distinct'
export type TableOrientation = 'horizontal' | 'vertical'

export type ReportDefinition = {
  fields: ReportField[]
  formulas: SeedFormula[]
  sheetName: string
  currencySymbol: string
}

export type ReportBuilderAppProps = {
  records: readonly ReportRow[]
  initialReportDefinition?: Partial<ReportDefinition>
  onReportDefinitionChange?: (definition: ReportDefinition) => void
  canEditReport?: boolean
  initialTableOrientation?: TableOrientation
  initialAggregateMode?: AggregateMode
  initialEditMode?: boolean
}

export type ReportBuilderOptions = ReportBuilderAppProps & {
  initialTableOrientation: TableOrientation
  initialAggregateMode: AggregateMode
  initialEditMode: boolean
}
