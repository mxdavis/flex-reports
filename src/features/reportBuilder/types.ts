export type AggregateMode = 'none' | 'sum' | 'avg'
export type TableOrientation = 'horizontal' | 'vertical'

export type ReportBuilderAppProps = {
  initialTableOrientation?: TableOrientation
  initialAggregateMode?: AggregateMode
  initialEditMode?: boolean
}
