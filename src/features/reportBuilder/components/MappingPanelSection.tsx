import ColumnDetailEditor from '../../../components/ColumnDetailEditor'
import MappingFieldCard from '../sections/MappingFieldCard'
import type {
  AggregationMode,
  DisplayType,
  ReportField,
} from '../../../services/reportDefinition/types'
import SectionTitleRow from '../../../shared/components/SectionTitleRow'
import './MappingPanelSection.css'

export type MappingPanelSectionProps = {
  fields: ReportField[]
  isAddingColumn: boolean
  addColumnPosition: number
  addColumnSourceKey: string
  addColumnLabel: string
  addColumnDisplayType: DisplayType
  addColumnAggregation: AggregationMode
  maxColumns: number
  showTips: boolean
  getFieldWarning: (field: ReportField) => string | null
  minColumns: number
  draggedFieldId: string | null
  dragOverFieldId: string | null
  editingFieldId: string | null
  editingFieldDraft: ReportField | null
  sourceOptions: string[]
  displayTypeOptions: Array<{ value: DisplayType, label: string }>
  aggregationOptions: Array<{ value: AggregationMode, label: string }>
  onStartAddColumn: () => void
  onCancelAddColumn: () => void
  onAddColumnPositionChange: (value: number) => void
  onAddColumnSourceKeyChange: (value: string) => void
  onAddColumnLabelChange: (value: string) => void
  onAddColumnDisplayTypeChange: (value: DisplayType) => void
  onAddColumnAggregationChange: (value: AggregationMode) => void
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
  onSetEditingFieldAggregation: (value: AggregationMode) => void
  isCollapsed?: boolean
  onToggleCollapsed?: () => void
}
function MappingPanelSection({
  fields,
  isAddingColumn,
  addColumnPosition,
  addColumnSourceKey,
  addColumnLabel,
  addColumnDisplayType,
  addColumnAggregation,
  maxColumns,
  showTips,
  getFieldWarning,
  minColumns,
  draggedFieldId,
  dragOverFieldId,
  editingFieldId,
  editingFieldDraft,
  sourceOptions,
  displayTypeOptions,
  aggregationOptions,
  onStartAddColumn,
  onCancelAddColumn,
  onAddColumnPositionChange,
  onAddColumnSourceKeyChange,
  onAddColumnLabelChange,
  onAddColumnDisplayTypeChange,
  onAddColumnAggregationChange,
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
  onSetEditingFieldAggregation,
  isCollapsed = false,
  onToggleCollapsed,
}: MappingPanelSectionProps) {
  return (
    <section id="fr-report-columns" className="fr-mapping-panel fr-jump-target">
      <SectionTitleRow
        title="Column Mapping"
        sectionName="columns"
        contentId="fr-report-columns-content"
        isCollapsed={isCollapsed}
        onToggleCollapsed={onToggleCollapsed}
      />
      {!isCollapsed && (
        <>
          <p className="fr-mapping-help">
            Build your report layout here. Choose what each column pulls from,
            rename the header users see, and drag cards to reorder the final output.
          </p>
          {showTips && (
            <p className="fr-mapping-tip">
              <strong>Tip:</strong> Grouping nests by each column from the left. Put the columns you
              group by first, then the column that names each row, then your numbers. To choose how
              a column adds up in group totals, edit the column and set
              its <strong>Total type</strong> (for example Sum for hours, Average for a rate).
            </p>
          )}
          {!isAddingColumn && (
            <div className="fr-formula-add-card">
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
            <div className="fr-formula-editor" id="fr-report-columns-content">
              <div className="fr-formula-editor-grid">
                <label htmlFor="fr-add-column-position">Column number</label>
                <select
                  id="fr-add-column-position"
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
                  aggregation: addColumnAggregation,
                  currencySymbol: '',
                }}
                columnLabel="Data point"
                sourceOptions={sourceOptions}
                displayTypeOptions={displayTypeOptions}
                aggregationOptions={aggregationOptions}
                onSourceChange={onAddColumnSourceKeyChange}
                onLabelChange={onAddColumnLabelChange}
                onDisplayTypeChange={onAddColumnDisplayTypeChange}
                onAggregationChange={onAddColumnAggregationChange}
              />
              <div className="fr-formula-editor-actions">
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
          {!isAddingColumn && (
            <div className="fr-mapping-grid" id="fr-report-columns-content">
              {fields.map((field, index) => (
                <MappingFieldCard
                  key={field.id}
                  field={field}
                  warning={getFieldWarning(field)}
                  index={index}
                  fieldsLength={fields.length}
                  draggedFieldId={draggedFieldId}
                  dragOverFieldId={dragOverFieldId}
                  editingFieldId={editingFieldId}
                  editingFieldDraft={editingFieldDraft}
                  sourceOptions={sourceOptions}
                  displayTypeOptions={displayTypeOptions}
                  aggregationOptions={aggregationOptions}
                  minColumns={minColumns}
                  onMoveField={onMoveField}
                  onStartEditField={onStartEditField}
                  onCancelEditField={onCancelEditField}
                  onSaveEditField={onSaveEditField}
                  onRemoveField={onRemoveField}
                  onSetDraggedFieldId={onSetDraggedFieldId}
                  onSetDragOverFieldId={onSetDragOverFieldId}
                  onSetEditingFieldSourceKey={onSetEditingFieldSourceKey}
                  onSetEditingFieldLabel={onSetEditingFieldLabel}
                  onSetEditingFieldDisplayType={onSetEditingFieldDisplayType}
                  onSetEditingFieldAggregation={onSetEditingFieldAggregation}
                />
              ))}
            </div>
          )}
        </>
      )}
    </section>
  )
}

export default MappingPanelSection
