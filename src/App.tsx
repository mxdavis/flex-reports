import { useEffect, useMemo, useState } from 'react'
import {
  getBillingSeed,
  getReportRows,
  getTotalRevenue,
} from './services/adapters'
import type { ReportRow } from './services/adapters'
import {
  generateDefaultReportData,
  loadReportData,
  saveReportData,
} from './services/reportDefinition/storage'
import type { ReportData, SourceColumn } from './services/reportDefinition/types'
import './App.css'

const CURRENCY_FIELD_IDS = new Set(['rate', 'total'])
const sourceDefaultLabels = ['Date', 'People', 'Clients', 'Task', 'Hours', 'Rate', 'Total']

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
  const canEditReport = import.meta.env.VITE_CAN_EDIT_REPORT !== 'false'

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
      defaultLabel: sourceDefaultLabels[index] ?? String(key),
    }))
  }, [])

  const [reportData, setReportData] = useState<ReportData>(() => {
    return loadReportData(sourceColumns)
  })

  useEffect(() => {
    setReportData((previous) => {
      const defaults = generateDefaultReportData(sourceColumns)
      const safeColumns = new Set(sourceColumns.map((column) => column.id))
      const fields = previous.fields.map((field, index) => {
        if (safeColumns.has(field.columnId)) {
          return field
        }

        return {
          ...field,
          columnId: defaults.fields[index]?.columnId ?? defaults.fields[0].columnId,
        }
      })

      const columnLabels = { ...defaults.columnLabels, ...previous.columnLabels }

      return {
        version: 1,
        fields,
        columnLabels,
      }
    })
  }, [sourceColumns])

  useEffect(() => {
    saveReportData(reportData)
  }, [reportData])

  const sourceColumnById = useMemo(() => {
    return new Map(sourceColumns.map((column) => [column.id, column]))
  }, [sourceColumns])

  const sampleRow = rows[0]

  function getMappedValue(row: ReportRow, columnId: string): string {
    const mappedColumn = sourceColumnById.get(columnId)
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

      {canEditReport && (
      <section className="mapping-panel">
        <h2>Column Mapping</h2>
        <p>
          Assign each semantic field to the customer&apos;s source columns and rename
          headers without touching code.
        </p>

        <div className="mapping-grid">
          {reportData.fields.map((field) => {
            const selectedColumnId = field.columnId
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
                    setReportData((previous) => ({
                      ...previous,
                      fields: previous.fields.map((currentField) => {
                        if (currentField.id !== field.id) {
                          return currentField
                        }

                        return {
                          ...currentField,
                          columnId: nextColumn,
                        }
                      }),
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
                  value={reportData.columnLabels[selectedColumnId] ?? ''}
                  onChange={(event) => {
                    const nextLabel = event.target.value
                    setReportData((previous) => ({
                      ...previous,
                      columnLabels: {
                        ...previous.columnLabels,
                        [selectedColumnId]: nextLabel,
                      },
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
      )}

      {!canEditReport && (
        <section className="mapping-panel">
          <h2>Report View</h2>
          <p>
            You are viewing this report without edit permissions.
          </p>
        </section>
      )}

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
              {reportData.fields.map((field) => {
                const columnId = field.columnId
                return (
                  <th key={field.id}>{reportData.columnLabels[columnId] ?? field.label}</th>
                )
              })}
            </tr>
          </thead>
          <tbody>
            {rows.slice(0, 10).map((row) => (
              <tr key={row.id}>
                {reportData.fields.map((field) => {
                  const mappedValue = getMappedValue(row, field.columnId)
                  const isCurrency = CURRENCY_FIELD_IDS.has(field.id)
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
