import type { ComponentPropsWithoutRef, ReactNode } from 'react'
import './EditableCard.css'

type EditableCardProps = ComponentPropsWithoutRef<'article'> & {
  summaryLeft: ReactNode
  summaryRight?: ReactNode
  // Replaces the summary while shown, e.g. an editor.
  detail?: ReactNode
  actions?: ReactNode
}

function EditableCard({
  summaryLeft,
  summaryRight,
  detail,
  actions,
  className,
  ...articleProps
}: EditableCardProps) {
  return (
    <article
      {...articleProps}
      className={['fr-editable-card', className].filter(Boolean).join(' ')}
    >
      {!detail && (
        <div className="fr-editable-card-summary">
          <strong>{summaryLeft}</strong>
          {summaryRight && <span className="fr-editable-card-summary-right">{summaryRight}</span>}
        </div>
      )}
      {detail && <div className="fr-editable-card-detail">{detail}</div>}
      {actions && <div className="fr-editable-card-actions">{actions}</div>}
    </article>
  )
}

export default EditableCard
