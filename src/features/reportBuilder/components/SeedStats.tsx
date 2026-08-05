import './SeedStats.css'

type SeedStatsProps = {
  peopleCount: number
  clientsCount: number
  timeEntriesCount: number
  totalRevenue: number
}

function SeedStats({
  peopleCount,
  clientsCount,
  timeEntriesCount,
  totalRevenue,
}: SeedStatsProps) {
  return (
    <section className="seed-stats">
      <article>
        <h2>People</h2>
        <strong>{peopleCount}</strong>
      </article>
      <article>
        <h2>Clients</h2>
        <strong>{clientsCount}</strong>
      </article>
      <article>
        <h2>Time Entries</h2>
        <strong>{timeEntriesCount}</strong>
      </article>
      <article>
        <h2>Total Revenue</h2>
        <strong>${totalRevenue.toFixed(2)}</strong>
      </article>
    </section>
  )
}

export default SeedStats
