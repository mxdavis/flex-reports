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

const MAX_REPORT_COLUMNS = 15
const MIN_REPORT_COLUMNS = 1

function formatCellValue(value: unknown): string {
  if (typeof value === 'number') {
    return value.toFixed(2)
  }

  if (value === null || value === undefined) {
    return ''
  }

  return String(value)
}

function getNextFieldId(existingIds: string[]): string {
  let maxSequence = 0

  for (const id of existingIds) {
    const match = /^field-(\d+)$/.exec(id)
    if (!match) {
      continue
    }

    const sequence = Number(match[1])
    if (Number.isFinite(sequence) && sequence > maxSequence) {
      maxSequence = sequence
    }
  }

  return `field-${maxSequence + 1}`
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
      defaultLabel: `column${index + 1}`,
    }))
  }, [])

  const [reportData, setReportData] = useState<ReportData>(() => {
    return loadReportData(sourceColumns)
  })
  const [draggedFieldId, setDraggedFieldId] = useState<string | null>(null)

  useEffect(() => {
    setReportData((previous) => {
      const defaults = generateDefaultReportData(sourceColumns)
      const safeSourceKeys = new Set(sourceColumns.map((column) => column.key))
      const fields = previous.fields.map((field, index) => {
        if (safeSourceKeys.has(field.sourceKey)) {
          return field
        }

        return {
          ...field,
          sourceKey: defaults.fields[index]?.sourceKey ?? defaults.fields[0].sourceKey,
        }
      })

      return {
        version: 3,
        fields,
      }
    })
  }, [sourceColumns])

  useEffect(() => {
    saveReportData(reportData)
  }, [reportData])

  const sourceColumnByKey = useMemo(() => {
    return new Map(sourceColumns.map((column) => [column.key, column]))
  }, [sourceColumns])

  const sampleRow = rows[0]

  function getMappedValue(row: ReportRow, sourceKey: keyof ReportRow): string {
    const mappedColumn = sourceColumnByKey.get(sourceKey)
    if (!mappedColumn) {
      return ''
    }

    return formatCellValue(row[mappedColumn.key])
  }

  function moveField(sourceId: string, targetId: string): void {
    if (sourceId === targetId) {
      return
    }

    setReportData((previous) => {
      const fromIndex = previous.fields.findIndex((field) => field.id === sourceId)
      const toIndex = previous.fields.findIndex((field) => field.id === targetId)
      if (fromIndex < 0 || toIndex < 0) {
        return previous
      }

      const nextFields = [...previous.fields]
      const [moved] = nextFields.splice(fromIndex, 1)
      nextFields.splice(toIndex, 0, moved)

      return {
        ...previous,
        fields: nextFields,
      }
    })
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
          Assign each report column to a source attribute and rename headers
          without touching code.
        </p>

        <div className="mapping-grid">
          {reportData.fields.map((field, index) => {
            const selectedSourceKey = field.sourceKey
            const selectedColumn = sourceColumnByKey.get(selectedSourceKey)
            const sampleValue = sampleRow && selectedColumn
              ? formatCellValue(sampleRow[selectedColumn.key])
              : ''

            return (
              <article
                key={field.id}
                draggable
                onDragStart={() => {
                  setDraggedFieldId(field.id)
                }}
                onDragOver={(event) => {
                  event.preventDefault()
                }}
                onDrop={(event) => {
                  event.preventDefault()
                  if (draggedFieldId) {
                    moveField(draggedFieldId, field.id)
                  }
                  setDraggedFieldId(null)
                }}
                onDragEnd={() => {
                  setDraggedFieldId(null)
                }}
                className={draggedFieldId === field.id ? 'dragging' : ''}
              >
                <div className="column-card-header">
                  <strong>{`column${index + 1}`}</strong>
                  <button
                    type="button"
                    onClick={() => {
                      setReportData((previous) => {
                        if (previous.fields.length <= MIN_REPORT_COLUMNS) {
                          return previous
                        }

                        return {
                          ...previous,
                          fields: previous.fields.filter((current) => current.id !== field.id),
                        }
                      })
                    }}
                    disabled={reportData.fields.length <= MIN_REPORT_COLUMNS}
                  >
                    Remove
                  </button>
                </div>
                <label htmlFor={`mapping-${field.id}`}>{`column${index + 1}`}</label>
                <select
                  id={`mapping-${field.id}`}
                  value={selectedSourceKey}
                  onChange={(event) => {
                    const nextSourceKey = event.target.value as keyof ReportRow
                    setReportData((previous) => ({
                      ...previous,
                      fields: previous.fields.map((currentField) => {
                        if (currentField.id !== field.id) {
                          return currentField
                        }

                        const keepCustomLabel = currentField.label !== currentField.sourceKey

                        return {
                          ...currentField,
                          sourceKey: nextSourceKey,
                          label: keepCustomLabel ? currentField.label : String(nextSourceKey),
                        }
                      }),
                    }))
                  }}
                >
                  {sourceColumns.map((column) => (
                    <option key={column.id} value={column.key}>
                      {column.id} ({column.key})
                    </option>
                  ))}
                </select>

                <label htmlFor={`label-${field.id}`}>Display label</label>
                <input
                  id={`label-${field.id}`}
                  type="text"
                  value={field.label}
                  onChange={(event) => {
                    const nextLabel = event.target.value
                    setReportData((previous) => ({
                      ...previous,
                      fields: previous.fields.map((currentField) => {
                        if (currentField.id !== field.id) {
                          return currentField
                        }

                        return {
                          ...currentField,
                          label: nextLabel,
                        }
                      }),
                    }))
                  }}
                />

                <small>
                  Sample value: <strong>{sampleValue || 'n/a'}</strong>
                </small>
              </article>
            )
          })}

          <article className="add-column-card">
            <button
              type="button"
              onClick={() => {
                setReportData((previous) => {
                  if (previous.fields.length >= MAX_REPORT_COLUMNS) {
                    return previous
                  }

                  return {
                    ...previous,
                    fields: [
                      ...previous.fields,
                      {
                        id: getNextFieldId(previous.fields.map((field) => field.id)),
                        label: String(sourceColumns[0]?.key ?? 'workDate'),
                        sourceKey: sourceColumns[0]?.key ?? 'workDate',
                      },
                    ],
                  }
                })
              }}
              disabled={reportData.fields.length >= MAX_REPORT_COLUMNS}
            >
              Add column
            </button>
            <small>{reportData.fields.length}/{MAX_REPORT_COLUMNS} columns</small>
          </article>
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
                return <th key={field.id}>{field.label}</th>
              })}
            </tr>
          </thead>
          <tbody>
            {rows.slice(0, 10).map((row) => (
              <tr key={row.id}>
                {reportData.fields.map((field) => {
                  const mappedValue = getMappedValue(row, field.sourceKey)
                  const mappedColumn = sourceColumnByKey.get(field.sourceKey)
                  const isCurrency = mappedColumn?.key === 'rate' || mappedColumn?.key === 'total'
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
