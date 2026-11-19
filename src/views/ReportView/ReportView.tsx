import type { TimeslipRow } from '../../models/reportTypes'
import { useReportPreview } from '../../controllers/useReportPreview'
import './ReportView.css'

type ReportViewProps = {
  rows: TimeslipRow[]
}

function currency(value: number): string {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value)
}

export function ReportView({ rows }: ReportViewProps) {
  const { pivotRows } = useReportPreview(rows)
  const maxGross = Math.max(...pivotRows.map((row) => row.grossFees), 0)

  return (
    <section className="report-view">
      <header className="report-header">
        <h2>Saved report view</h2>
        <p>Web-friendly summary with simple filters and chart-style comparison.</p>
      </header>

      <div className="report-grid">
        <section className="report-card">
          <h3>Pivot summary by employee</h3>
          <table>
            <thead>
              <tr>
                <th>Employee</th>
                <th>Total Hours</th>
                <th>Gross Fees</th>
              </tr>
            </thead>
            <tbody>
              {pivotRows.map((row) => (
                <tr key={row.group}>
                  <td>{row.group}</td>
                  <td>{row.totalHours.toFixed(2)}</td>
                  <td>{currency(row.grossFees)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>

        <section className="report-card">
          <h3>Gross fees chart</h3>
          <ul className="bar-list" aria-label="Gross fee comparison">
            {pivotRows.map((row) => (
              <li key={row.group}>
                <div className="bar-label">
                  <strong>{row.group}</strong>
                  <span>{currency(row.grossFees)}</span>
                </div>
                <div className="bar-track" role="presentation">
                  <div
+                    className="bar-fill"
+                    style={{ width: maxGross === 0 ? '0%' : `${(row.grossFees / maxGross) * 100}%` }}
+                  />
+                </div>
+              </li>
+            ))}
+          </ul>
+        </section>
+      </div>
+    </section>
+  )
+}
