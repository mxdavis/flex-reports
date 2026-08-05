import AutocompleteInput from './AutocompleteInput'
import type {
  ChipAggregationMode,
  DisplayType,
  ReportField,
} from '../services/reportDefinition/types'
import './ColumnDetailEditor.css'

type DisplayTypeOption = {
  value: DisplayType
  label: string
}

type ChipAggregationOption = {
  value: ChipAggregationMode
  label: string
}

type ColumnDetailEditorProps = {
  field: ReportField
  columnLabel: string
  sourceOptions: string[]
  displayTypeOptions: DisplayTypeOption[]
  chipAggregationOptions: ChipAggregationOption[]
  onSourceChange: (nextValue: string) => void
  onLabelChange: (nextValue: string) => void
  onDisplayTypeChange: (nextValue: DisplayType) => void
  onChipAggregationChange: (nextValue: ChipAggregationMode) => void
}

function ColumnDetailEditor({
  field,
  columnLabel,
  sourceOptions,
  displayTypeOptions,
  chipAggregationOptions,
  onSourceChange,
  onLabelChange,
  onDisplayTypeChange,
  onChipAggregationChange,
}: ColumnDetailEditorProps) {
  return (
    <div className="column-detail-editor drag-block">
      <label htmlFor={`mapping-${field.id}`}>{columnLabel}</label>
      <AutocompleteInput
        id={`mapping-${field.id}`}
        value={field.sourceKey}
        options={sourceOptions}
        title="Type or choose which data endpoint fills this report column."
        onChange={onSourceChange}
      />

      <label htmlFor={`label-${field.id}`}>Display label</label>
      <input
        id={`label-${field.id}`}
        type="text"
        value={field.label}
        title="Header text shown in the report output. You can override it."
        onChange={(event) => {
          onLabelChange(event.target.value)
        }}
      />

      <label htmlFor={`display-type-${field.id}`}>Display type</label>
      <select
        id={`display-type-${field.id}`}
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
        htmlFor={`chip-aggregation-${field.id}`}
        title="Controls how this column appears in summary chips above the chart."
      >
        Chip type
      </label>
      <select
        id={`chip-aggregation-${field.id}`}
        value={field.chipAggregation}
        title="Controls how this column appears in summary chips above the chart."
        onChange={(event) => {
          onChipAggregationChange(event.target.value as ChipAggregationMode)
        }}
      >
        {chipAggregationOptions.map((chipAggregationOption) => (
          <option key={chipAggregationOption.value} value={chipAggregationOption.value}>
            {chipAggregationOption.label}
          </option>
        ))}
      </select>
    </div>
  )
}

export default ColumnDetailEditor
