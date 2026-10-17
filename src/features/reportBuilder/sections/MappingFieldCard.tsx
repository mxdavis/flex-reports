import ColumnDetailEditor from '../../../components/ColumnDetailEditor'
import EditableCard from '../../../components/EditableCard'
import type {
  AggregationMode,
  DisplayType,
  ReportField,
} from '../../../services/reportDefinition/types'
import './MappingFieldCard.css'

type MappingFieldCardProps = {
  field: ReportField
  index: number
  fieldsLength: number
  draggedFieldId: string | null
  dragOverFieldId: string | null
  editingFieldId: string | null
  editingFieldDraft: ReportField | null
  sourceOptions: string[]
  displayTypeOptions: Array<{ value: DisplayType, label: string }>
  aggregationOptions: Array<{ value: AggregationMode, label: string }>
  minColumns: number
  onMoveField: (sourceId: string, targetId: string) => void
  onStartEditField: (field: ReportField) => void
  onCancelEditField: () => void
  onSaveEditField: (fieldId: string) => void
  onRemoveField: (fieldId: string) => void
  onSetDraggedFieldId: (value: string | null) => void
  onSetDragOverFieldId: (value: string | null) => void
  onSetEditingFieldSourceKey: (value: string) => void
  onSetEditingFieldLabel: (value: string) => void
  onSetEditingFieldDisplayType: (value: DisplayType) => void
  onSetEditingFieldAggregation: (value: AggregationMode) => void
}

function MappingFieldCard({
  field,
  index,
  fieldsLength,
  draggedFieldId,
  dragOverFieldId,
  editingFieldId,
  editingFieldDraft,
  sourceOptions,
  displayTypeOptions,
  aggregationOptions,
  minColumns,
  onMoveField,
  onStartEditField,
  onCancelEditField,
  onSaveEditField,
  onRemoveField,
  onSetDraggedFieldId,
  onSetDragOverFieldId,
  onSetEditingFieldSourceKey,
  onSetEditingFieldLabel,
  onSetEditingFieldDisplayType,
  onSetEditingFieldAggregation,
}: MappingFieldCardProps) {
  return (
    <EditableCard
      key={field.id}
      draggable
      onDragStart={(event) => {
        const target = event.target as HTMLElement
        if (target.closest('.drag-block') || target.closest('button')) {
          event.preventDefault()
          return
        }

        onSetDraggedFieldId(field.id)
      }}
      onDragEnter={(event) => {
        event.preventDefault()
        if (draggedFieldId && draggedFieldId !== field.id) {
          onSetDragOverFieldId(field.id)
        }
      }}
      onDragOver={(event) => {
        event.preventDefault()
        if (draggedFieldId && draggedFieldId !== field.id) {
          onSetDragOverFieldId(field.id)
        }
      }}
      onDrop={(event) => {
        event.preventDefault()
        if (draggedFieldId) {
          onMoveField(draggedFieldId, field.id)
        }
        onSetDraggedFieldId(null)
        onSetDragOverFieldId(null)
      }}
      onDragEnd={() => {
        onSetDraggedFieldId(null)
        onSetDragOverFieldId(null)
      }}
      className={[
        draggedFieldId === field.id ? 'dragging' : '',
        dragOverFieldId === field.id ? 'drag-over' : '',
      ].filter(Boolean).join(' ')}
      summaryLeft={field.label}
      summaryRight={`COLUMN ${index + 1}`}
      detail={editingFieldId === field.id && editingFieldDraft ? (
        <ColumnDetailEditor
          field={editingFieldDraft}
          columnLabel={`COLUMN ${index + 1}`}
          sourceOptions={sourceOptions}
          displayTypeOptions={displayTypeOptions}
          aggregationOptions={aggregationOptions}
          onSourceChange={onSetEditingFieldSourceKey}
          onLabelChange={onSetEditingFieldLabel}
          onDisplayTypeChange={onSetEditingFieldDisplayType}
          onAggregationChange={onSetEditingFieldAggregation}
        />
      ) : null}
      actions={
        <>
          {editingFieldId === field.id ? (
            <>
              <button
                type="button"
                onClick={() => onSaveEditField(field.id)}
                title="Save this column edit."
                aria-label={`Save COLUMN ${index + 1}`}
              >
                Save
              </button>
              <button
                type="button"
                onClick={onCancelEditField}
                title="Cancel this column edit."
                aria-label={`Cancel COLUMN ${index + 1}`}
              >
                Cancel
              </button>
            </>
          ) : (
            <button
              type="button"
              onClick={() => onStartEditField(field)}
              title="Open column editor."
              aria-label={`Edit COLUMN ${index + 1}`}
            >
              Edit
            </button>
          )}
          <button
            type="button"
            onClick={() => onRemoveField(field.id)}
            disabled={fieldsLength <= minColumns}
            title="Remove this column from the report layout."
          >
            Remove
          </button>
        </>
      }
    />
  )
}

export default MappingFieldCard
