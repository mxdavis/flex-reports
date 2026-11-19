import ColumnDetailEditor from '../../../components/ColumnDetailEditor'
import { useElementId } from '../../../shared/hooks/useElementId'
import MappingFieldCard from '../sections/MappingFieldCard'
import type {
  AggregationMode,
  DisplayType,
  ReportField,
} from '../../../services/reportDefinition/types'
import ConfirmDialog, { type ConfirmDialogProps } from '../../../shared/components/ConfirmDialog'
import SectionTitleRow from '../../../shared/components/SectionTitleRow'
import type { NewColumnDraft } from '../state/uiState'
import './MappingPanelSection.css'

export type MappingPanelSectionProps = {
  // Asks whether to save the open column before editing another.
  columnSwitchDialog: ConfirmDialogProps
  fields: ReportField[]
  // The Add column form's draft, or null when the form is closed.
  newColumn: NewColumnDraft | null
  maxColumns: number
  showTips: boolean
  // Fields that hold several entries per row, so can't be a column.
  skippedFields?: string[]
  getFieldWarning: (field: ReportField) => string | null
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
  columnSwitchDialog,
  fields,
  newColumn,
  maxColumns,
  showTips,
  skippedFields = [],
  getFieldWarning,
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
  const addColumnPositionId = useElementId('add-column-position')
  const reportColumnsId = useElementId('report-columns')
  const reportColumnsContentId = useElementId('report-columns-content')
  return (
    <section id={reportColumnsId} className="fr-mapping-panel fr-jump-target">
      <SectionTitleRow
        title="Column Mapping"
        sectionName="columns"
        contentId={reportColumnsContentId}
        isCollapsed={isCollapsed}
        onToggleCollapsed={onToggleCollapsed}
      />
      {!isCollapsed && (
        <div id={reportColumnsContentId}>
          <p className="fr-mapping-help">
            Build your report layout here. Choose what each column pulls from,
            rename the header users see, and drag cards to reorder the final output.
          </p>
          {showTips && fields.length > 1 && (
            <p className="fr-mapping-tip">
              <strong>Tip:</strong> Grouping nests by each column from the left. Put the columns you
              group by first, then the column that names each row, then your numbers.
            </p>
          )}
          {showTips && skippedFields.length > 0 && (
            <p className="fr-mapping-tip" role="note">
              <strong>Not available as a column:</strong> {skippedFields.join(', ')}. Each row has
              more than one entry for {skippedFields.length === 1 ? 'this' : 'these'} (for example,
              several invoices for one client). Ask whoever provided the data to give one entry per row.
            </p>
          )}
          {!newColumn && (
            <div className="fr-add-card">
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
          {newColumn && (
            <div className="fr-editor">
              <div className="fr-editor-grid">
                <label htmlFor={addColumnPositionId}>Column number</label>
                <select
                  id={addColumnPositionId}
                  // Columns can be removed while this is open; saving then adds it at the end.
                  value={Math.min(newColumn.position, fields.length + 1)}
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
                field={newColumn.draft}
                columnLabel="Data point"
                sourceOptions={sourceOptions}
                displayTypeOptions={displayTypeOptions}
                aggregationOptions={aggregationOptions}
                onSourceChange={onAddColumnSourceKeyChange}
                onLabelChange={onAddColumnLabelChange}
                onDisplayTypeChange={onAddColumnDisplayTypeChange}
                onAggregationChange={onAddColumnAggregationChange}
              />
              <div className="fr-editor-actions">
                <button
                  type="button"
                  onClick={onSaveNewColumn}
                  disabled={fields.length >= maxColumns || !newColumn.draft.sourceKey.trim()}
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
          <div className="fr-mapping-grid">
            {fields.map((field, index) => (
              <MappingFieldCard
                key={field.id}
                field={field}
                warning={getFieldWarning(field)}
                index={index}
                draggedFieldId={draggedFieldId}
                dragOverFieldId={dragOverFieldId}
                editingFieldId={editingFieldId}
                editingFieldDraft={editingFieldDraft}
                sourceOptions={sourceOptions}
                displayTypeOptions={displayTypeOptions}
                aggregationOptions={aggregationOptions}
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
        </div>
      )}
      <ConfirmDialog {...columnSwitchDialog} />
    </section>
  )
}

export default MappingPanelSection
