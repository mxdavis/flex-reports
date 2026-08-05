import ColumnDetailEditor from '../../../components/ColumnDetailEditor'
import EditableCard from '../../../components/EditableCard'
import type {
  ChipAggregationMode,
  DisplayType,
  ReportField,
} from '../../../services/reportDefinition/types'
import './MappingPanelSection.css'

type MappingPanelSectionProps = {
  fields: ReportField[]
  isAddingColumn: boolean
  addColumnPosition: number
  addColumnSourceKey: string
  addColumnLabel: string
  addColumnDisplayType: DisplayType
  addColumnChipAggregation: ChipAggregationMode
  maxColumns: number
  minColumns: number
  draggedFieldId: string | null
  dragOverFieldId: string | null
  editingFieldId: string | null
  editingFieldDraft: ReportField | null
  sourceOptions: string[]
  displayTypeOptions: Array<{ value: DisplayType, label: string }>
  chipAggregationOptions: Array<{ value: ChipAggregationMode, label: string }>
  onStartAddColumn: () => void
  onCancelAddColumn: () => void
  onAddColumnPositionChange: (value: number) => void
  onAddColumnSourceKeyChange: (value: string) => void
  onAddColumnLabelChange: (value: string) => void
  onAddColumnDisplayTypeChange: (value: DisplayType) => void
  onAddColumnChipAggregationChange: (value: ChipAggregationMode) => void
  onSaveNewColumn: () => void
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
  onSetEditingFieldChipAggregation: (value: ChipAggregationMode) => void
}
function MappingPanelSection({
  fields,
  isAddingColumn,
  addColumnPosition,
  addColumnSourceKey,
  addColumnLabel,
  addColumnDisplayType,
  addColumnChipAggregation,
  maxColumns,
  minColumns,
  draggedFieldId,
  dragOverFieldId,
  editingFieldId,
  editingFieldDraft,
  sourceOptions,
  displayTypeOptions,
  chipAggregationOptions,
  onStartAddColumn,
  onCancelAddColumn,
  onAddColumnPositionChange,
  onAddColumnSourceKeyChange,
  onAddColumnLabelChange,
  onAddColumnDisplayTypeChange,
  onAddColumnChipAggregationChange,
  onSaveNewColumn,
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
  onSetEditingFieldChipAggregation,
}: MappingPanelSectionProps) {
  return (
    <section id="report-columns" className="mapping-panel jump-target">
      <h2>Column Mapping</h2>
      <p className="mapping-help">
        Build your report layout here. Choose what each column pulls from,
        rename the header users see, and drag cards to reorder the final output.
      </p>
      {!isAddingColumn && (
        <div className="formula-add-card">
          <button
            type="button"
            onClick={onStartAddColumn}
            disabled={fields.length >= maxColumns}
            title="Add a new column."
          >
            Add column
          </button>
          <small>{fields.length}/{maxColumns} columns</small>
        </div>
      )}
      {isAddingColumn && (
        <div className="formula-editor">
          <div className="formula-editor-grid">
            <label htmlFor="add-column-position">Column number</label>
            <select
              id="add-column-position"
              value={addColumnPosition}
              title="Insert this new column at the selected position. Existing columns will shift right."
              onChange={(event) => {
                onAddColumnPositionChange(Number(event.target.value))
              }}
            >
              {Array.from({ length: fields.length + 1 }, (_, index) => {
                const position = index + 1
                return <option key={position} value={position}>{position}</option>
              })}
            </select>
          </div>
          <ColumnDetailEditor
            field={{
              id: 'add-column',
              sourceKey: addColumnSourceKey,
              label: addColumnLabel,
              displayType: addColumnDisplayType,
              chipAggregation: addColumnChipAggregation,
              currencySymbol: '',
            }}
            columnLabel="Data point"
            sourceOptions={sourceOptions}
            displayTypeOptions={displayTypeOptions}
            chipAggregationOptions={chipAggregationOptions}
            onSourceChange={onAddColumnSourceKeyChange}
            onLabelChange={onAddColumnLabelChange}
            onDisplayTypeChange={onAddColumnDisplayTypeChange}
            onChipAggregationChange={onAddColumnChipAggregationChange}
          />
          <div className="formula-editor-actions">
            <button
              type="button"
              onClick={onSaveNewColumn}
              disabled={fields.length >= maxColumns}
            >
              Save column
            </button>
            <button type="button" onClick={onCancelAddColumn}>Cancel</button>
          </div>
          <small>
            Column numbers are fixed after insert. To reorder existing columns, drag and drop cards.
          </small>
        </div>
      )}
      <div className="mapping-grid">
        {fields.map((field, index) => (
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
                chipAggregationOptions={chipAggregationOptions}
                onSourceChange={onSetEditingFieldSourceKey}
                onLabelChange={onSetEditingFieldLabel}
                onDisplayTypeChange={onSetEditingFieldDisplayType}
                onChipAggregationChange={onSetEditingFieldChipAggregation}
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
                  disabled={fields.length <= minColumns}
                  title="Remove this column from the report layout."
                >
                  Remove
                </button>
              </>
            }
          />
        ))}
      </div>
    </section>
  )
}

export default MappingPanelSection
