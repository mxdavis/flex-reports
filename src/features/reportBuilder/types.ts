export type AggregateMode = 'none' | 'sum' | 'avg' | 'count' | 'distinct'
export type TableOrientation = 'horizontal' | 'vertical'

export type ReportBuilderAppProps = {
  initialTableOrientation?: TableOrientation
  initialAggregateMode?: AggregateMode
  initialEditMode?: boolean
}
