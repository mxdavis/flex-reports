import { useEffect, useMemo, useState } from 'react'
import {
  getBillingSeed,
  getReportRows,
  getTotalRevenue,
} from './services/adapters'
import type { ReportRow } from './services/adapters'
import './App.css'

type SemanticField = 'date' | 'people' | 'clients' | 'task' | 'hours' | 'rate' | 'total'

type SourceColumn = {
  id: string
  key: keyof ReportRow
  defaultLabel: string
}

const semanticFields: Array<{ id: SemanticField; label: string }> = [
  { id: 'date', label: 'Date' },
  { id: 'people', label: 'People' },
  { id: 'clients', label: 'Clients' },
  { id: 'task', label: 'Task' },
  { id: 'hours', label: 'Hours' },
  { id: 'rate', label: 'Rate' },
  { id: 'total', label: 'Total' },
]

const defaultSemanticColumn: Record<SemanticField, string> = {
  date: 'column1',
  people: 'column2',
  clients: 'column3',
  task: 'column4',
  hours: 'column5',
  rate: 'column6',
  total: 'column7',
}

function formatCellValue(value: unknown): string {
  if (typeof value === 'number') {
    return value.toFixed(2)
  }

  if (value === null || value === undefined) {
    return ''
  }

  return String(value)
}

function App() {
  const seed = useMemo(() => getBillingSeed(), [])
  const rows = useMemo(() => getReportRows(), [])
  const totalRevenue = useMemo(() => getTotalRevenue(rows), [rows])
  const [semanticMapping, setSemanticMapping] = useState<Record<SemanticField, string>>(
    defaultSemanticColumn,
  )
  const [columnLabels, setColumnLabels] = useState<Record<string, string>>({})

  const sourceColumns = useMemo<SourceColumn[]>(() => {
    const configuredColumns: Array<keyof ReportRow> = [
      'workDate',
      'personName',
      'clientName',
      'task',
      'hours',
      'rate',
      'total',
    ]

    return configuredColumns.map((key, index) => ({
      id: `column${index + 1}`,
      key,
      defaultLabel: semanticFields[index]?.label ?? String(key),
    }))
  }, [])

  useEffect(() => {
    if (sourceColumns.length === 0) {
      return
    }

    setColumnLabels((previous) => {
      const next = { ...previous }
      for (const column of sourceColumns) {
        if (!next[column.id]) {
          next[column.id] = column.defaultLabel
        }
      }
      return next
    })

    setSemanticMapping((previous) => {
      const next = { ...previous }
      for (const field of semanticFields) {
        if (!next[field.id]) {
          next[field.id] = defaultSemanticColumn[field.id]
        }
      }
      return next
    })
  }, [sourceColumns])

  const sourceColumnById = useMemo(() => {
    return new Map(sourceColumns.map((column) => [column.id, column]))
  }, [sourceColumns])

  const sampleRow = rows[0]

  function getMappedValue(row: ReportRow, field: SemanticField): string {
    const mappedColumn = sourceColumnById.get(semanticMapping[field])
    if (!mappedColumn) {
      return ''
    }

    return formatCellValue(row[mappedColumn.key])
  }

  return (
    <div className="seed-page">
      <header className="seed-header">
        <h1>Flex Reports Seed Playground</h1>
        <p>
          Billing-style mock data is loaded from JSON so we can build and test
          reports without a database.
        </p>
      </header>

      <section className="mapping-panel">
        <h2>Column Mapping</h2>
        <p>
          Assign each semantic field to the customer&apos;s source columns and rename
          headers without touching code.
        </p>

        <div className="mapping-grid">
          {semanticFields.map((field) => {
            const selectedColumnId = semanticMapping[field.id]
            const selectedColumn = sourceColumnById.get(selectedColumnId)
            const sampleValue = sampleRow && selectedColumn
              ? formatCellValue(sampleRow[selectedColumn.key])
              : ''

            return (
              <article key={field.id}>
                <label htmlFor={`mapping-${field.id}`}>{field.label}</label>
                <select
                  id={`mapping-${field.id}`}
                  value={selectedColumnId}
                  onChange={(event) => {
                    const nextColumn = event.target.value
                    setSemanticMapping((previous) => ({
                      ...previous,
                      [field.id]: nextColumn,
                    }))
                  }}
                >
                  {sourceColumns.map((column) => (
                    <option key={column.id} value={column.id}>
                      {column.id} ({column.key})
                    </option>
                  ))}
                </select>

                <label htmlFor={`label-${field.id}`}>Display label</label>
                <input
                  id={`label-${field.id}`}
                  type="text"
                  value={columnLabels[selectedColumnId] ?? ''}
                  onChange={(event) => {
                    const nextLabel = event.target.value
                    setColumnLabels((previous) => ({
                      ...previous,
                      [selectedColumnId]: nextLabel,
                    }))
                  }}
                />

                <small>
                  Sample value: <strong>{sampleValue || 'n/a'}</strong>
                </small>
              </article>
            )
          })}
        </div>
      </section>

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
              {semanticFields.map((field) => {
                const columnId = semanticMapping[field.id]
                return <th key={field.id}>{columnLabels[columnId] ?? columnId}</th>
              })}
            </tr>
          </thead>
          <tbody>
            {rows.slice(0, 10).map((row) => (
              <tr key={row.id}>
                {semanticFields.map((field) => {
                  const mappedValue = getMappedValue(row, field.id)
                  const isCurrency = field.id === 'rate' || field.id === 'total'
                  return (
                    <td key={`${row.id}-${field.id}`}>
                      {isCurrency && mappedValue ? `$${mappedValue}` : mappedValue}
                    </td>
                  )
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </div>
  )
}

export default App
