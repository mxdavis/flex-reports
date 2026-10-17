import './SummaryChips.css'

export type SummaryItem = {
  label: string
  value: string
}

type SummaryChipsProps = {
  items: SummaryItem[]
}

function SummaryChips({ items }: SummaryChipsProps) {
  return (
    <section className="fr-summary-chips">
      {items.map((item) => (
        <article key={item.label}>
          <h2>{item.label}</h2>
          <strong>{item.value}</strong>
        </article>
      ))}
    </section>
  )
}

export default SummaryChips
