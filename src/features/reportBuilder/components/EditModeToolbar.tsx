import EditIcon from '../../../shared/icons/EditIcon'
import ViewIcon from '../../../shared/icons/ViewIcon'
import './EditModeToolbar.css'

export type EditModeToolbarProps = {
  isEditMode: boolean
  onToggle: () => void
  jumpTargets?: Array<{ id: string, label: string }>
  onJumpToSection?: (id: string) => void
  canSave?: boolean
  isDirty?: boolean
  isSaving?: boolean
  saveError?: string
  onSave?: () => void
}

function EditModeToolbar({
  isEditMode,
  onToggle,
  jumpTargets = [],
  onJumpToSection,
  canSave = false,
  isDirty = false,
  isSaving = false,
  saveError = '',
  onSave,
}: EditModeToolbarProps) {
  return (
    <div className="fr-workspace-toolbar">
      <div className="fr-workspace-toolbar-group">
        <button
          type="button"
          className="fr-workspace-toolbar-button"
          onClick={onToggle}
          title={isEditMode ? 'Switch to view mode' : 'Switch to edit mode'}
        >
          {isEditMode ? <ViewIcon /> : <EditIcon />}
          <span>{isEditMode ? 'View mode' : 'Edit mode'}</span>
        </button>
        {isEditMode && jumpTargets.length > 0 && (
          <nav className="fr-workspace-toolbar-nav" aria-label="Edit section navigation">
            {jumpTargets.map((target) => (
              <button
                key={target.id}
                type="button"
                className="fr-workspace-toolbar-button fr-workspace-toolbar-jump"
                onClick={() => {
                  onJumpToSection?.(target.id)
                }}
              >
                {target.label}
              </button>
            ))}
          </nav>
        )}
        {canSave && (
          <button
            type="button"
            className="fr-workspace-toolbar-button fr-workspace-toolbar-save"
            onClick={onSave}
            disabled={!isDirty || isSaving}
            title={isDirty ? 'Save this report as the default view for everyone.' : 'No unsaved changes.'}
          >
            {isSaving ? 'Saving…' : 'Save report'}
          </button>
        )}
        {saveError && <span className="fr-workspace-toolbar-error" role="alert">{saveError}</span>}
      </div>
    </div>
  )
}

export default EditModeToolbar
