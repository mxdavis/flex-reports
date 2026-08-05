import EditIcon from '../../../shared/icons/EditIcon'
import ViewIcon from '../../../shared/icons/ViewIcon'
import './EditModeToolbar.css'

type EditModeToolbarProps = {
  canEditReport: boolean
  isEditMode: boolean
  onToggle: () => void
  jumpTargets?: Array<{ id: string, label: string }>
  onJumpToSection?: (id: string) => void
}

function EditModeToolbar({
  canEditReport,
  isEditMode,
  onToggle,
  jumpTargets = [],
  onJumpToSection,
}: EditModeToolbarProps) {
  if (!canEditReport) {
    return null
  }

  return (
    <div className="workspace-toolbar">
      <div className="workspace-toolbar-group">
        <button
          type="button"
          className="workspace-toolbar-button"
          onClick={onToggle}
          title={isEditMode ? 'Switch to view mode' : 'Switch to edit mode'}
        >
          {isEditMode ? <ViewIcon /> : <EditIcon />}
          <span>{isEditMode ? 'View mode' : 'Edit mode'}</span>
        </button>
        {isEditMode && jumpTargets.length > 0 && (
          <nav className="workspace-toolbar-nav" aria-label="Edit section navigation">
            {jumpTargets.map((target) => (
              <button
                key={target.id}
                type="button"
                className="workspace-toolbar-button workspace-toolbar-jump"
                onClick={() => {
                  onJumpToSection?.(target.id)
                }}
              >
                {target.label}
              </button>
            ))}
          </nav>
        )}
      </div>
    </div>
  )
}

export default EditModeToolbar
