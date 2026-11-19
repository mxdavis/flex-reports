import type { TimeslipRow } from '../../models/reportTypes'
import { useReportPreview } from '../../controllers/useReportPreview'
import './EditView.css'

type EditViewProps = {
  rows: TimeslipRow[]
}

export function EditView({ rows }: EditViewProps) {
  const { previewRows } = useReportPreview(rows)

  return (
    <section className="edit-view">
      <header className="sheet-header">
        <h2>Edit mode</h2>
        <p>Column formulas apply to all rows just like a familiar worksheet flow.</p>
      </header>

      <div className="formula-strip">
        <div><span>G</span> = {{'{hours}'}} * {{'{rate}'}}</div>
        <div><span>H</span> = {{'{grossFees}'}} * 10%</div>
        <div><span>I</span> = {{'{grossFees}'}} - {{'{writeDown}'}}</div>
      </div>

      <div className="sheet-wrap">
        <table className="sheet-grid">
          <thead>
            <tr>
              <th>Date</th>
              <th>Employee</th>
              <th>Client</th>
              <th>Task</th>
              <th>Hours</th>
              <th>Rate</th>
              <th>Gross</th>
              <th>Write Down</th>
              <th>Net</th>
            </tr>
          </thead>
          <tbody>
            {previewRows.map((row) => (
              <tr key={row.id}>
                <td>{row.workDate}</td>
                <td>{row.employee}</td>
                <td>{row.client}</td>
                <td>{row.task}</td>
                <td className="num">{row.hours.toFixed(2)}</td>
                <td className="num">${row.rate.toFixed(2)}</td>
                <td className="num">${row.grossFees.toFixed(2)}</td>
                <td className="num">${row.writeDown.toFixed(2)}</td>
                <td className="num">${row.netFees.toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  )
}
