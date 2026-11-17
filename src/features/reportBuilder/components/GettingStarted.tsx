import { useElementId } from '../../../shared/hooks/useElementId'
import './GettingStarted.css'

export type GettingStartedField = { key: string, label: string }

export type GettingStartedProps = {
  fields: GettingStartedField[]
  // Fields already shown as a column.
  selectedKeys: string[]
  rowCount: number
  canAddMore: boolean
  onToggleField: (key: string) => void
}

// A blank report's first step: tick the fields to show as columns.
function GettingStarted({ fields, selectedKeys, rowCount, canAddMore, onToggleField }: GettingStartedProps) {
  const titleId = useElementId('getting-started-title')
  return (
    <section className="fr-getting-started" aria-labelledby={titleId}>
      <h2 id={titleId}>Getting started</h2>
      <p className="fr-getting-started-help">
        Tick the fields to show as columns. {rowCount.toLocaleString('en-US')} {rowCount === 1 ? 'row' : 'rows'} loaded.
      </p>
      <div className="fr-getting-started-fields">
        {fields.map((field) => {
          const isSelected = selectedKeys.includes(field.key)
          return (
            <label key={field.key}>
              <input
                type="checkbox"
                checked={isSelected}
                disabled={!isSelected && !canAddMore}
                onChange={() => onToggleField(field.key)}
              />
              {field.label}
            </label>
          )
        })}
      </div>
    </section>
  )
}

export default GettingStarted
