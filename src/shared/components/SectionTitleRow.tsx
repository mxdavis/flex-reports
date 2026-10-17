import ChevronToggleIcon from '../icons/ChevronToggleIcon'
import './SectionTitleRow.css'

type SectionTitleRowProps = {
  title: string
  // Lowercase noun used in the toggle's accessible name, e.g. "columns".
  sectionName: string
  contentId: string
  isCollapsed: boolean
  onToggleCollapsed?: () => void
}

function SectionTitleRow({ title, sectionName, contentId, isCollapsed, onToggleCollapsed }: SectionTitleRowProps) {
  const toggleLabel = `${isCollapsed ? 'Expand' : 'Collapse'} ${sectionName}`

  return (
    <div className="section-title-row">
      <h2>{title}</h2>
      {onToggleCollapsed && (
        <button
          type="button"
          className="collapse-toggle-button"
          onClick={onToggleCollapsed}
          aria-label={toggleLabel}
          aria-expanded={!isCollapsed}
          aria-controls={contentId}
          title={toggleLabel}
        >
          <ChevronToggleIcon direction={isCollapsed ? 'down' : 'up'} />
        </button>
      )}
    </div>
  )
}

export default SectionTitleRow
