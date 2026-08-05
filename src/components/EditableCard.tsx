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
      className={['editable-card', className].filter(Boolean).join(' ')}
    >
      {shouldShowSummary && (
        <div className="editable-card-summary">
          <strong title={summaryLeftTooltip}>{summaryLeft}</strong>
          {summaryRight && <span className="editable-card-summary-right">{summaryRight}</span>}
        </div>
      )}
      {detail && <div className="editable-card-detail">{detail}</div>}
      {actions && <div className="editable-card-actions">{actions}</div>}
    </article>
  )
}

export default EditableCard
