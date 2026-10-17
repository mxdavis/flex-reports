import { useElementId } from '../shared/hooks/useElementId'
import AutocompleteInput from '../shared/components/AutocompleteInput'
import type {
  AggregationMode,
  DisplayType,
  ReportField,
} from '../services/reportDefinition/types'
import './ColumnDetailEditor.css'

type DisplayTypeOption = {
  value: DisplayType
  label: string
}

type AggregationOption = {
  value: AggregationMode
  label: string
}

type ColumnDetailEditorProps = {
  field: ReportField
  columnLabel: string
  sourceOptions: string[]
  displayTypeOptions: DisplayTypeOption[]
  aggregationOptions: AggregationOption[]
  onSourceChange: (nextValue: string) => void
  onLabelChange: (nextValue: string) => void
  onDisplayTypeChange: (nextValue: DisplayType) => void
  onAggregationChange: (nextValue: AggregationMode) => void
}

function ColumnDetailEditor({
  field,
  columnLabel,
  sourceOptions,
  displayTypeOptions,
  aggregationOptions,
  onSourceChange,
  onLabelChange,
  onDisplayTypeChange,
  onAggregationChange,
}: ColumnDetailEditorProps) {
  const sourceId = useElementId(`mapping-${field.id}`)
  const labelId = useElementId(`label-${field.id}`)
  const displayTypeId = useElementId(`display-type-${field.id}`)
  const aggregationId = useElementId(`aggregation-${field.id}`)
  return (
    <div className="fr-column-detail-editor fr-drag-block">
      <label htmlFor={sourceId}>{columnLabel}</label>
      <AutocompleteInput
        id={sourceId}
        value={field.sourceKey}
        options={sourceOptions}
        title="Type or choose which data endpoint fills this report column."
        onChange={onSourceChange}
      />

      <label htmlFor={labelId}>Display label</label>
      <input
        id={labelId}
        type="text"
        value={field.label}
        title="Header text shown in the report output. You can override it."
        onChange={(event) => {
          onLabelChange(event.target.value)
        }}
      />

      <label htmlFor={displayTypeId}>Display type</label>
      <select
        id={displayTypeId}
        value={field.displayType}
        title="Choose how values in this column are formatted."
        onChange={(event) => {
          onDisplayTypeChange(event.target.value as DisplayType)
        }}
      >
        {displayTypeOptions.map((displayTypeOption) => (
          <option key={displayTypeOption.value} value={displayTypeOption.value}>
            {displayTypeOption.label}
          </option>
        ))}
      </select>

      <label
        htmlFor={aggregationId}
        title="How this column is totalled in summary chips, group totals, and the grand total."
      >
        Total type
      </label>
      <select
        id={aggregationId}
        value={field.aggregation}
        title="How this column is totalled in summary chips, group totals, and the grand total."
        onChange={(event) => {
          onAggregationChange(event.target.value as AggregationMode)
        }}
      >
        {aggregationOptions.map((aggregationOption) => (
          <option key={aggregationOption.value} value={aggregationOption.value}>
            {aggregationOption.label}
          </option>
        ))}
      </select>
    </div>
  )
}

export default ColumnDetailEditor
