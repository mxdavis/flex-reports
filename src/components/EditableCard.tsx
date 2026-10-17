import type { ComponentPropsWithoutRef, ReactNode } from 'react'
import './EditableCard.css'

type EditableCardProps = ComponentPropsWithoutRef<'article'> & {
  summaryLeft: ReactNode
  summaryRight?: ReactNode
  summaryLeftTooltip?: string
  detail?: ReactNode
  showSummaryWhenDetail?: boolean
  actions?: ReactNode
}

function EditableCard({
  summaryLeft,
  summaryRight,
  summaryLeftTooltip,
  detail,
  showSummaryWhenDetail = false,
  actions,
  className,
  ...articleProps
}: EditableCardProps) {
  const shouldShowSummary = !detail || showSummaryWhenDetail

  return (
    <article
      {...articleProps}
      className={['fr-editable-card', className].filter(Boolean).join(' ')}
    >
      {shouldShowSummary && (
        <div className="fr-editable-card-summary">
          <strong title={summaryLeftTooltip}>{summaryLeft}</strong>
          {summaryRight && <span className="fr-editable-card-summary-right">{summaryRight}</span>}
        </div>
      )}
      {detail && <div className="fr-editable-card-detail">{detail}</div>}
      {actions && <div className="fr-editable-card-actions">{actions}</div>}
    </article>
  )
}

export default EditableCard
