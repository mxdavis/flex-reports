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
  return (
    <div className="fr-column-detail-editor fr-drag-block">
      <label htmlFor={`fr-mapping-${field.id}`}>{columnLabel}</label>
      <AutocompleteInput
        id={`fr-mapping-${field.id}`}
        value={field.sourceKey}
        options={sourceOptions}
        title="Type or choose which data endpoint fills this report column."
        onChange={onSourceChange}
      />

      <label htmlFor={`fr-label-${field.id}`}>Display label</label>
      <input
        id={`fr-label-${field.id}`}
        type="text"
        value={field.label}
        title="Header text shown in the report output. You can override it."
        onChange={(event) => {
          onLabelChange(event.target.value)
        }}
      />

      <label htmlFor={`fr-display-type-${field.id}`}>Display type</label>
      <select
        id={`fr-display-type-${field.id}`}
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
        htmlFor={`fr-aggregation-${field.id}`}
        title="How this column is totalled in summary chips, group totals, and the grand total."
      >
        Total type
      </label>
      <select
        id={`fr-aggregation-${field.id}`}
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
