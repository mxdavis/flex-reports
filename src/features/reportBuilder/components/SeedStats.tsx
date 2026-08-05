import './SeedStats.css'

export type SummaryItem = {
  label: string
  value: string
}

type SeedStatsProps = {
  items: SummaryItem[]
}

function SeedStats({ items }: SeedStatsProps) {
  return (
    <section className="seed-stats">
      {items.map((item) => (
        <article key={item.label}>
          <h2>{item.label}</h2>
          <strong>{item.value}</strong>
        </article>
      ))}
    </section>
  )
}

export default SeedStats
