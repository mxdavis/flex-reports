import { useMemo } from 'react'
import {
  getBillingSeed,
  getReportRows,
  getTotalRevenue,
} from './services/adapters/mockDataSource'
import './App.css'

function App() {
  const seed = useMemo(() => getBillingSeed(), [])
  const rows = useMemo(() => getReportRows(), [])
  const totalRevenue = useMemo(() => getTotalRevenue(rows), [rows])

  return (
    <div className="seed-page">
      <header className="seed-header">
        <h1>Flex Reports Seed Playground</h1>
        <p>
          Billing-style mock data is loaded from JSON so we can build and test
          reports without a database.
        </p>
      </header>

      <section className="seed-stats">
        <article>
          <h2>People</h2>
          <strong>{seed.personBilling.length}</strong>
        </article>
        <article>
          <h2>Clients</h2>
          <strong>{seed.client.length}</strong>
        </article>
        <article>
          <h2>Time Entries</h2>
          <strong>{rows.length}</strong>
        </article>
        <article>
          <h2>Total Revenue</h2>
          <strong>${totalRevenue.toFixed(2)}</strong>
        </article>
      </section>

      <section className="seed-formulas">
        <h2>Seeded formulas</h2>
        <ul>
          {seed.formulas.map((formula) => (
            <li key={formula.columnId}>
              <span>{formula.label}</span>
              <code>{formula.expression}</code>
            </li>
          ))}
        </ul>
      </section>

      <section className="seed-table">
        <h2>Sample rows</h2>
        <table>
          <thead>
            <tr>
              <th>Date</th>
              <th>Person</th>
              <th>Client</th>
              <th>Task</th>
              <th>Hours</th>
              <th>Rate</th>
              <th>Total</th>
            </tr>
          </thead>
          <tbody>
            {rows.slice(0, 10).map((row) => (
              <tr key={row.id}>
                <td>{row.workDate}</td>
                <td>{row.personName}</td>
                <td>{row.clientName}</td>
                <td>{row.task}</td>
                <td>{row.hours.toFixed(2)}</td>
                <td>${row.rate.toFixed(2)}</td>
                <td>${row.total.toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </div>
  )
}

export default App
