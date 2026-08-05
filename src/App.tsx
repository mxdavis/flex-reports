import { useEffect, useMemo, useRef, useState } from 'react'
import {
  getBillingSeed,
  getReportRows,
  getTotalRevenue,
} from './services/adapters'
import type { ReportRow } from './services/adapters'
import type { SeedFormula } from './services/adapters'
import {
  generateDefaultReportData,
  loadReportData,
  saveReportData,
} from './services/reportDefinition/storage'
import {
  loadFormulaData,
  saveFormulaData,
} from './services/reportDefinition/formulaStorage'
import { evaluateFormula } from './services/formula/evaluateFormula'
import { getDefaultDisplayType } from './services/reportDefinition/displayType'
import AutocompleteInput from './components/AutocompleteInput'
import TokenizedExpressionInput from './components/TokenizedExpressionInput'
import type {
  DisplayType,
  ReportData,
  SourceColumn,
} from './services/reportDefinition/types'
import './App.css'

const MAX_REPORT_COLUMNS = 15
const MIN_REPORT_COLUMNS = 1
const MAX_FORMULAS = 25
type AggregateMode = 'none' | 'sum' | 'avg'
const DISPLAY_TYPE_OPTIONS: Array<{ value: DisplayType, label: string }> = [
  { value: 'currency', label: 'Currency' },
  { value: 'decimal', label: 'Decimal number' },
  { value: 'percent', label: 'Percent' },
  { value: 'date', label: 'Date' },
  { value: 'string', label: 'String' },
]

function EditIcon() {
  return (
    <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true">
      <path d="M4 16.8V20h3.2L18.5 8.7l-3.2-3.2L4 16.8Z" fill="none" stroke="currentColor" strokeWidth="1.8" />
      <path d="m13.8 6.2 3.2 3.2" fill="none" stroke="currentColor" strokeWidth="1.8" />
    </svg>
  )
}

function ViewIcon() {
  return (
    <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true">
      <path d="M2 12s3.5-6 10-6 10 6 10 6-3.5 6-10 6S2 12 2 12Z" fill="none" stroke="currentColor" strokeWidth="1.8" />
      <circle cx="12" cy="12" r="2.8" fill="none" stroke="currentColor" strokeWidth="1.8" />
    </svg>
  )
}

function SideArrowIcon() {
  return (
    <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true">
      <path d="M4 12h16" fill="none" stroke="currentColor" strokeWidth="1.8" />
      <path d="m7 9-3 3 3 3" fill="none" stroke="currentColor" strokeWidth="1.8" />
      <path d="m17 9 3 3-3 3" fill="none" stroke="currentColor" strokeWidth="1.8" />
    </svg>
  )
}

function UpDownArrowIcon() {
  return (
    <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true">
      <path d="M12 4v16" fill="none" stroke="currentColor" strokeWidth="1.8" />
      <path d="m9 7 3-3 3 3" fill="none" stroke="currentColor" strokeWidth="1.8" />
      <path d="m9 17 3 3 3-3" fill="none" stroke="currentColor" strokeWidth="1.8" />
    </svg>
  )
}

function formatCellValue(value: unknown, displayType: DisplayType): string {
  if (value === null || value === undefined) {
    return ''
  }

  if (typeof value === 'number' && Number.isNaN(value)) {
    return 'NaN'
  }

  if (displayType === 'currency') {
    if (typeof value !== 'number') {
      return String(value)
    }

    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(value)
  }

  if (displayType === 'decimal') {
    if (typeof value !== 'number') {
      return String(value)
    }

    return value.toFixed(2)
  }

  if (displayType === 'percent') {
    if (typeof value !== 'number') {
      return String(value)
    }

    return `${(value * 100).toFixed(2)}%`
  }

  if (displayType === 'date') {
    const parsedDate = value instanceof Date ? value : new Date(String(value))
    if (Number.isNaN(parsedDate.getTime())) {
      return String(value)
    }

    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).format(parsedDate)
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

function getNextFormulaLabel(existingLabels: string[]): string {
  let maxSequence = 0

  for (const label of existingLabels) {
    const match = /^formula(\d+)$/.exec(label)
    if (!match) {
      continue
    }

    const sequence = Number(match[1])
    if (Number.isFinite(sequence) && sequence > maxSequence) {
      maxSequence = sequence
    }
  }

  return `formula${maxSequence + 1}`
}

function validateFormulaInput(
  formulas: SeedFormula[],
  candidate: SeedFormula,
  options?: { ignoreLabel?: string },
): string {
  const label = candidate.label.trim()
  const expression = candidate.expression.trim()

  if (!label || !expression) {
    return 'Label and expression are required.'
  }

  if (!/^[A-Za-z][A-Za-z0-9_ ]*$/.test(label)) {
    return 'Label must start with a letter and use only letters, numbers, spaces, and _.'
  }

  const normalizedLabel = label.toLowerCase()
  const ignoredLabel = options?.ignoreLabel?.toLowerCase()
  const hasDuplicate = formulas.some((formula) => {
    const currentLabel = formula.label.toLowerCase()
    if (ignoredLabel && currentLabel === ignoredLabel) {
      return false
    }

    return currentLabel === normalizedLabel
  })

  if (hasDuplicate) {
    return `A formula with label "${label}" already exists.`
  }

  return ''
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
  const [formulas, setFormulas] = useState<SeedFormula[]>(() => {
    return loadFormulaData(seed.formulas)
  })
  const [newFormula, setNewFormula] = useState<SeedFormula>(() => ({
    label: getNextFormulaLabel(seed.formulas.map((formula) => formula.label)),
    expression: '{{hours}} * {{rate}}',
  }))
  const [formulaError, setFormulaError] = useState<string>('')
  const [editingFormulaLabel, setEditingFormulaLabel] = useState<string | null>(null)
  const [editingFormula, setEditingFormula] = useState<SeedFormula | null>(null)
  const [editingFormulaError, setEditingFormulaError] = useState<string>('')
  const [isAddingFormula, setIsAddingFormula] = useState(false)
  const [isEditMode, setIsEditMode] = useState(canEditReport)
  const [tableOrientation, setTableOrientation] = useState<'horizontal' | 'vertical'>('horizontal')
  const [sumDuplicatesInVertical, setSumDuplicatesInVertical] = useState(false)
  const [aggregateMode, setAggregateMode] = useState<AggregateMode>('none')
  const [draggedFieldId, setDraggedFieldId] = useState<string | null>(null)
  const [dragOverFieldId, setDragOverFieldId] = useState<string | null>(null)
  const [isTableFullscreen, setIsTableFullscreen] = useState(false)
  const tableScrollRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    setReportData((previous) => {
      const defaults = generateDefaultReportData(sourceColumns)
      const safeSourceKeys = new Set(
        [...sourceColumns.map((column) => String(column.key)), ...formulas.map((formula) => formula.label)]
          .map((key) => key.toLowerCase()),
      )
      const fields = previous.fields.map((field, index) => {
        if (safeSourceKeys.has(field.sourceKey.toLowerCase())) {
          return field
        }

        return {
          ...field,
          sourceKey: defaults.fields[index]?.sourceKey ?? defaults.fields[0].sourceKey,
        }
      })

      return {
        version: 4,
        fields,
      }
    })
  }, [formulas, sourceColumns])

  useEffect(() => {
    saveReportData(reportData)
  }, [reportData])

  useEffect(() => {
    saveFormulaData(formulas)
  }, [formulas])

  useEffect(() => {
    const tableScrollElement = tableScrollRef.current
    if (!tableScrollElement) {
      return
    }

    tableScrollElement.scrollTo({
      left: tableScrollElement.scrollWidth,
      behavior: 'smooth',
    })
  }, [reportData.fields.length])

  useEffect(() => {
    if (!isTableFullscreen) {
      return
    }

    function handleEscape(event: KeyboardEvent): void {
      if (event.key === 'Escape') {
        setIsTableFullscreen(false)
      }
    }

    window.addEventListener('keydown', handleEscape)
    return () => {
      window.removeEventListener('keydown', handleEscape)
    }
  }, [isTableFullscreen])

  const sourceColumnByKey = useMemo(() => {
    return new Map(sourceColumns.map((column) => [String(column.key), column]))
  }, [sourceColumns])

  const sourceOptions = useMemo(() => {
    const formulaLabels = formulas.map((formula) => formula.label)
    return Array.from(new Set([...sourceColumns.map((column) => String(column.key)), ...formulaLabels]))
  }, [formulas, sourceColumns])

  const formulasByLabel = useMemo(() => {
    const mapped = new Map<string, string>()
    for (const formula of formulas) {
      mapped.set(formula.label.toLowerCase(), formula.expression)
    }
    return mapped
  }, [formulas])

  const formulaTokenOptions = useMemo(() => {
    return Array.from(new Set([
      ...sourceColumns.map((column) => String(column.key)),
      ...formulas.map((formula) => `%${formula.label}`),
    ]))
  }, [formulas, sourceColumns])

  const sampleRow = rows[0]
  const previewRows = rows.slice(0, 10)
  const isHorizontalTable = tableOrientation === 'horizontal'
  const showTotals = aggregateMode !== 'none'

  function getPreferredDisplayType(sourceKey: string): DisplayType {
    const normalizedKey = sourceKey.toLowerCase().trim()
    const numericBaseKeys = new Set(['hours', 'rate', 'total', 'grossfees', 'writedown', 'netfees'])

    if (formulasByLabel.has(normalizedKey)) {
      return 'decimal'
    }

    if (numericBaseKeys.has(normalizedKey)) {
      return 'decimal'
    }

    return getDefaultDisplayType(sourceKey)
  }

  function buildBaseFormulaContext(row: ReportRow): Record<string, number> {
    const context: Record<string, number> = {}
    for (const [key, value] of Object.entries(row)) {
      if (typeof value === 'number' && Number.isFinite(value)) {
        context[key] = value
      }
    }

    return context
  }

  function getFormulaValue(
    formulaLabel: string,
    row: ReportRow,
    cache: Map<string, number>,
    visiting: Set<string>,
    context: Record<string, number>,
  ): number {
    const cached = cache.get(formulaLabel)
    if (cached !== undefined) {
      return cached
    }

    if (visiting.has(formulaLabel)) {
      return Number.NaN
    }

    const normalizedFormulaLabel = formulaLabel.toLowerCase()
    const expression = formulasByLabel.get(normalizedFormulaLabel)
    if (!expression) {
      return Number.NaN
    }

    visiting.add(formulaLabel)
    for (const dependency of formulasByLabel.keys()) {
      if (dependency === normalizedFormulaLabel || context[dependency] !== undefined) {
        continue
      }

      context[dependency] = getFormulaValue(dependency, row, cache, visiting, context)
    }

    const result = evaluateFormula(expression, context)
    const value = result.ok ? result.value : Number.NaN
    cache.set(formulaLabel, value)
    context[formulaLabel] = value
    context[normalizedFormulaLabel] = value
    visiting.delete(formulaLabel)
    return value
  }

  function getMappedValue(
    row: ReportRow,
    sourceKey: string,
    displayType: DisplayType,
  ): string {
    const mappedColumn = sourceColumnByKey.get(sourceKey)
    if (mappedColumn) {
      return formatCellValue(row[mappedColumn.key as keyof ReportRow], displayType)
    }

    if (!formulasByLabel.has(sourceKey.toLowerCase())) {
      return ''
    }

    const context = buildBaseFormulaContext(row)
    const value = getFormulaValue(sourceKey, row, new Map<string, number>(), new Set<string>(), context)
    return formatCellValue(value, displayType)
  }

  function getMappedNumericValue(row: ReportRow, sourceKey: string): number | null {
    const mappedColumn = sourceColumnByKey.get(sourceKey)
    if (mappedColumn) {
      const value = row[mappedColumn.key as keyof ReportRow]
      return typeof value === 'number' && Number.isFinite(value) ? value : null
    }

    if (!formulasByLabel.has(sourceKey.toLowerCase())) {
      return null
    }

    const context = buildBaseFormulaContext(row)
    return getFormulaValue(sourceKey, row, new Map<string, number>(), new Set<string>(), context)
  }

  function getAggregatedFieldValue(
    rowsToAggregate: ReportRow[],
    sourceKey: string,
    mode: AggregateMode,
  ): number | null {
    if (mode === 'none') {
      return null
    }

    let total = 0
    let count = 0

    for (const row of rowsToAggregate) {
      const numeric = getMappedNumericValue(row, sourceKey)
      if (numeric === null) {
        continue
      }

      if (Number.isNaN(numeric)) {
        return Number.NaN
      }

      total += numeric
      count += 1
    }

    if (count === 0) {
      return null
    }

    return mode === 'avg' ? total / count : total
  }

  const verticalColumns = useMemo(() => {
    const firstField = reportData.fields[0]
    if (!firstField) {
      return [] as Array<{ key: string, headerValue: string, rows: ReportRow[] }>
    }

    if (!sumDuplicatesInVertical) {
      return previewRows.map((row) => ({
        key: row.id,
        headerValue: getMappedValue(row, firstField.sourceKey, firstField.displayType),
        rows: [row],
      }))
    }

    const grouped = new Map<string, { key: string, headerValue: string, rows: ReportRow[] }>()
    for (const row of previewRows) {
      const headerValue = getMappedValue(row, firstField.sourceKey, firstField.displayType)
      const groupKey = headerValue || '(blank)'
      const existing = grouped.get(groupKey)
      if (existing) {
        existing.rows.push(row)
        continue
      }

      grouped.set(groupKey, {
        key: `${groupKey}-${row.id}`,
        headerValue,
        rows: [row],
      })
    }

    return Array.from(grouped.values())
  }, [getMappedValue, previewRows, reportData.fields, sumDuplicatesInVertical])

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

  function handleAddFormula(): void {
    if (formulas.length >= MAX_FORMULAS) {
      setFormulaError(`Formula limit reached (${MAX_FORMULAS}).`)
      return
    }

    const candidate = {
      label: newFormula.label.trim(),
      expression: newFormula.expression.trim(),
    }
    const validationError = validateFormulaInput(formulas, candidate)
    if (validationError) {
      setFormulaError(validationError)
      return
    }

    setFormulas((previous) => {
      const next = [
        ...previous,
        candidate,
      ]

      setNewFormula({
        label: getNextFormulaLabel(next.map((formula) => formula.label)),
        expression: '{{hours}} * {{rate}}',
      })

      return next
    })
    setFormulaError('')
    setIsAddingFormula(false)
  }

  function handleStartEditFormula(formula: SeedFormula): void {
    setEditingFormulaLabel(formula.label)
    setEditingFormula({ ...formula })
    setEditingFormulaError('')
  }

  function handleCancelEditFormula(): void {
    setEditingFormulaLabel(null)
    setEditingFormula(null)
    setEditingFormulaError('')
  }

  function handleSaveEditFormula(originalLabel: string): void {
    if (!editingFormula) {
      return
    }

    const candidate: SeedFormula = {
      label: editingFormula.label.trim(),
      expression: editingFormula.expression.trim(),
    }

    const validationError = validateFormulaInput(formulas, candidate, {
      ignoreLabel: originalLabel,
    })
    if (validationError) {
      setEditingFormulaError(validationError)
      return
    }

    setFormulas((previous) => {
      return previous.map((current) => {
        if (current.label !== originalLabel) {
          return current
        }

        return candidate
      })
    })

    const normalizedOriginalLabel = originalLabel.toLowerCase()
    setReportData((previous) => ({
      ...previous,
      fields: previous.fields.map((field) => {
        if (field.sourceKey.toLowerCase() !== normalizedOriginalLabel) {
          return field
        }

        return {
          ...field,
          sourceKey: candidate.label,
          label: field.label === originalLabel ? candidate.label : field.label,
        }
      }),
    }))

    handleCancelEditFormula()
    setFormulaError('')
  }

  return (
    <div className="seed-page">
      <div className="workspace-toolbar">
        <div className="workspace-toolbar-group">
          {canEditReport && (
            <button
              type="button"
              className="workspace-toolbar-button"
              onClick={() => {
                setIsEditMode((previous) => !previous)
                setIsAddingFormula(false)
                setFormulaError('')
              }}
              title={isEditMode ? 'Switch to view mode' : 'Switch to edit mode'}
            >
              {isEditMode ? <ViewIcon /> : <EditIcon />}
              <span>{isEditMode ? 'View mode' : 'Edit mode'}</span>
            </button>
          )}
        </div>
      </div>

      {canEditReport && isEditMode && (
      <header className="seed-header">
        <h1>Flex Reports Seed Playground</h1>
        <p>
          Billing-style mock data is loaded from JSON so we can build and test
          reports without a database.
        </p>
      </header>
      )}

      {canEditReport && isEditMode && (
      <section className="mapping-panel">
        <h2>Column Mapping</h2>
        <p>
          Build your report layout here. Choose what each column pulls from,
          rename the header users see, and drag cards to reorder the final output.
        </p>
        <p className="mapping-help">
          Tip: column positions are fixed by order (column1, column2, ...). Reordering
          cards updates the position labels automatically.
        </p>

        <div className="mapping-grid">
          {reportData.fields.map((field, index) => {
            const selectedSourceKey = field.sourceKey
            const sampleValue = sampleRow
              ? getMappedValue(sampleRow, selectedSourceKey, field.displayType)
              : ''

            return (
              <article
                key={field.id}
                draggable
                onDragStart={(event) => {
                  const target = event.target as HTMLElement
                  if (target.closest('.drag-block') || target.closest('button')) {
                    event.preventDefault()
                    return
                  }

                  setDraggedFieldId(field.id)
                }}
                onDragEnter={(event) => {
                  event.preventDefault()
                  if (draggedFieldId && draggedFieldId !== field.id) {
                    setDragOverFieldId(field.id)
                  }
                }}
                onDragOver={(event) => {
                  event.preventDefault()
                  if (draggedFieldId && draggedFieldId !== field.id) {
                    setDragOverFieldId(field.id)
                  }
                }}
                onDrop={(event) => {
                  event.preventDefault()
                  if (draggedFieldId) {
                    moveField(draggedFieldId, field.id)
                  }
                  setDraggedFieldId(null)
                  setDragOverFieldId(null)
                }}
                onDragEnd={() => {
                  setDraggedFieldId(null)
                  setDragOverFieldId(null)
                }}
                className={[
                  draggedFieldId === field.id ? 'dragging' : '',
                  dragOverFieldId === field.id ? 'drag-over' : '',
                ].filter(Boolean).join(' ')}
              >
                <div className="column-card-header">
                  <strong
                    title={index === 0 ? 'This column becomes the header row in vertical view.' : undefined}
                  >
                    {`column${index + 1}`}
                  </strong>
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
                    title="Remove this column from the report layout."
                  >
                    Remove
                  </button>
                </div>
                <div className="drag-block">
                  <label htmlFor={`mapping-${field.id}`}>{`column${index + 1}`}</label>
                  <AutocompleteInput
                    id={`mapping-${field.id}`}
                    value={selectedSourceKey}
                    options={sourceOptions}
                    title="Type or choose which data endpoint fills this report column."
                    onChange={(nextValue) => {
                      const nextSourceKey = nextValue

                      setReportData((previous) => ({
                        ...previous,
                        fields: previous.fields.map((currentField) => {
                          if (currentField.id !== field.id) {
                            return currentField
                          }

                          const keepCustomLabel = currentField.label !== currentField.sourceKey
                          const currentDefaultDisplayType = getPreferredDisplayType(
                            currentField.sourceKey,
                          )
                          const shouldSyncDisplayType =
                            currentField.displayType === currentDefaultDisplayType

                          return {
                            ...currentField,
                            sourceKey: nextSourceKey,
                            label: keepCustomLabel ? currentField.label : String(nextSourceKey),
                            displayType: shouldSyncDisplayType
                              ? getPreferredDisplayType(nextSourceKey)
                              : currentField.displayType,
                          }
                        }),
                      }))
                    }}
                  />

                  <label htmlFor={`label-${field.id}`}>Display label</label>
                  <input
                    id={`label-${field.id}`}
                    type="text"
                    value={field.label}
                    title="Header text shown in the report output. You can override it."
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

                  <label htmlFor={`display-type-${field.id}`}>Display type</label>
                  <select
                    id={`display-type-${field.id}`}
                    value={field.displayType}
                    title="Choose how values in this column are formatted."
                    onChange={(event) => {
                      const nextDisplayType = event.target.value as DisplayType
                      setReportData((previous) => ({
                        ...previous,
                        fields: previous.fields.map((currentField) => {
                          if (currentField.id !== field.id) {
                            return currentField
                          }

                          return {
                            ...currentField,
                            displayType: nextDisplayType,
                          }
                        }),
                      }))
                    }}
                  >
                    {DISPLAY_TYPE_OPTIONS.map((displayTypeOption) => (
                      <option key={displayTypeOption.value} value={displayTypeOption.value}>
                        {displayTypeOption.label}
                      </option>
                    ))}
                  </select>
                </div>

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
                        label: sourceOptions[0] ?? 'workDate',
                        sourceKey: sourceOptions[0] ?? 'workDate',
                        displayType: getPreferredDisplayType(sourceOptions[0] ?? 'workDate'),
                      },
                    ],
                  }
                })
              }}
              disabled={reportData.fields.length >= MAX_REPORT_COLUMNS}
              title="Add a new column to the end of the report layout."
            >
              Add column
            </button>
            <small>{reportData.fields.length}/{MAX_REPORT_COLUMNS} columns</small>
          </article>
        </div>
      </section>
      )}

      {canEditReport && isEditMode && (
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
      )}

      {canEditReport && isEditMode && (
      <section className="seed-formulas">
        <h2>Seeded formulas</h2>
        <p
          className="mapping-help formula-help"
          title="Use {{fieldName}} for data fields and {{%Formula Label}} for formulas. Formula labels are case-insensitive."
        >
          Use {'{{fieldName}}'} for data fields and {'{{%Formula Label}}'} for formulas.
          {` Available formulas: ${formulas.map((formula) => formula.label).join(', ') || 'none yet'}.`}
        </p>
        {!isAddingFormula && (
          <div className="formula-add-card">
            <button
              type="button"
              onClick={() => {
                setFormulaError('')
                setIsAddingFormula(true)
              }}
              disabled={formulas.length >= MAX_FORMULAS}
              title="Add a new formula."
            >
              Add formula
            </button>
            <small>{formulas.length}/{MAX_FORMULAS} formulas</small>
          </div>
        )}

        {isAddingFormula && (
          <div className="formula-editor">
            <div className="formula-editor-grid">
              <label htmlFor="new-formula-label">Label</label>
              <input
                id="new-formula-label"
                type="text"
                value={newFormula.label}
                title="Formula label. You can reference it later as {{%Your Label}}."
                onChange={(event) => {
                  setNewFormula((previous) => ({
                    ...previous,
                    label: event.target.value,
                  }))
                }}
              />

              <label htmlFor="new-formula-expression">Expression</label>
              <TokenizedExpressionInput
                id="new-formula-expression"
                value={newFormula.expression}
                title="Type an expression. Enter {{ to see available fields and formulas. Formula refs use {{%Label}}."
                options={formulaTokenOptions}
                onChange={(nextExpression) => {
                  setNewFormula((previous) => ({
                    ...previous,
                    expression: nextExpression,
                  }))
                }}
              />
            </div>

            <div className="formula-editor-actions">
              <button
                type="button"
                onClick={handleAddFormula}
                disabled={formulas.length >= MAX_FORMULAS}
              >
                Save formula
              </button>
              <button
                type="button"
                onClick={() => {
                  setFormulaError('')
                  setIsAddingFormula(false)
                }}
              >
                Cancel
              </button>
            </div>

            <small>
              Use {'{{fieldName}}'} for data fields and {'{{%Formula Label}}'} for formulas.
            </small>

            {formulaError && <p className="formula-error">{formulaError}</p>}
          </div>
        )}

        <ul>
          {formulas.map((formula) => (
            <li key={formula.label}>
              {canEditReport && editingFormulaLabel === formula.label && editingFormula
                ? (
                  <>
                    <div className="formula-item-edit-grid">
                      <label htmlFor={`edit-label-${formula.label}`}>Label</label>
                      <input
                        id={`edit-label-${formula.label}`}
                        type="text"
                        value={editingFormula.label}
                        title="Formula label. References are case-insensitive and can include spaces."
                        onChange={(event) => {
                          setEditingFormula((previous) => {
                            if (!previous) {
                              return previous
                            }

                            return {
                              ...previous,
                              label: event.target.value,
                            }
                          })
                        }}
                      />

                      <label htmlFor={`edit-expression-${formula.label}`}>Expression</label>
                      <TokenizedExpressionInput
                        id={`edit-expression-${formula.label}`}
                        value={editingFormula.expression}
                        title="Type an expression. Enter {{ to see available fields and formulas. Formula refs use {{%Label}}."
                        options={formulaTokenOptions}
                        onChange={(nextExpression) => {
                          setEditingFormula((previous) => {
                            if (!previous) {
                              return previous
                            }

                            return {
                              ...previous,
                              expression: nextExpression,
                            }
                          })
                        }}
                      />
                    </div>

                    <div className="formula-item-actions">
                      <button
                        type="button"
                        onClick={() => {
                          handleSaveEditFormula(formula.label)
                        }}
                      >
                        Save
                      </button>
                      <button
                        type="button"
                        onClick={handleCancelEditFormula}
                      >
                        Cancel
                      </button>
                    </div>

                    {editingFormulaError && <p className="formula-error">{editingFormulaError}</p>}
                  </>
                )
                : (
                  <>
                    <div className="formula-item-readonly">
                      <div className="formula-item-details">
                        <span>{formula.label}</span>
                      </div>
                      <code>{formula.expression}</code>
                    </div>

                    {canEditReport && (
                      <div className="formula-item-actions">
                        <button
                          type="button"
                          onClick={() => {
                            handleStartEditFormula(formula)
                          }}
                          title="Edit this formula."
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setFormulas((previous) => {
                              return previous.filter((current) => current.label !== formula.label)
                            })
                            if (editingFormulaLabel === formula.label) {
                              handleCancelEditFormula()
                            }
                            setFormulaError('')
                          }}
                          title="Remove this formula from the saved seed list."
                        >
                          Remove
                        </button>
                      </div>
                    )}
                  </>
                )}
            </li>
          ))}
        </ul>
      </section>
      )}

      <section className={`seed-table ${isTableFullscreen ? 'fullscreen' : ''}`}>
        <div className="seed-table-header">
          <h2>Sample rows</h2>
          <div className="seed-table-actions">
            <span className="seed-table-mode">{`Mode: ${isHorizontalTable ? 'Horizontal' : 'Vertical'}`}</span>
            <label htmlFor="aggregate-mode" className="seed-table-mode">
              Aggregate
            </label>
            <select
              id="aggregate-mode"
              value={aggregateMode}
              title="Choose how totals and grouped values are calculated."
              onChange={(event) => {
                setAggregateMode(event.target.value as AggregateMode)
              }}
            >
              <option value="none">None</option>
              <option value="sum">Sum</option>
              <option value="avg">Average</option>
            </select>
            {!isHorizontalTable && (
              <button
                type="button"
                onClick={() => {
                  setSumDuplicatesInVertical((previous) => !previous)
                }}
                title="Group duplicate vertical headers and apply selected aggregate mode"
              >
                <span>{sumDuplicatesInVertical ? 'Ungroup duplicates' : 'Group duplicates'}</span>
              </button>
            )}
            <button
              type="button"
              onClick={() => {
                setTableOrientation((previous) => {
                  return previous === 'horizontal' ? 'vertical' : 'horizontal'
                })
              }}
              title={isHorizontalTable ? 'Switch to vertical view' : 'Switch to horizontal view'}
            >
              {isHorizontalTable ? <UpDownArrowIcon /> : <SideArrowIcon />}
              <span>{isHorizontalTable ? 'Vertical view' : 'Horizontal view'}</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setIsTableFullscreen((previous) => !previous)
              }}
              title={isTableFullscreen ? 'Exit expanded view' : 'Expand table to full screen'}
            >
              {isTableFullscreen ? 'Exit full screen' : 'Full screen'}
            </button>
          </div>
        </div>
        <div
          className="seed-table-scroll"
          role="region"
          aria-label="Sample report rows"
          ref={tableScrollRef}
        >
          <table>
            {isHorizontalTable
              ? (
                <>
                  <thead>
                    <tr>
                      {reportData.fields.map((field) => {
                        return <th key={field.id}>{field.label}</th>
                      })}
                    </tr>
                  </thead>
                  <tbody>
                    {previewRows.map((row) => (
                      <tr key={row.id}>
                        {reportData.fields.map((field) => {
                          const mappedValue = getMappedValue(
                            row,
                            field.sourceKey,
                            field.displayType,
                          )
                          return (
                            <td key={`${row.id}-${field.id}`}>{mappedValue}</td>
                          )
                        })}
                      </tr>
                    ))}
                  </tbody>
                  {showTotals && reportData.fields.length > 0 && (
                    <tfoot>
                      <tr>
                        {reportData.fields.map((field, index) => {
                          if (index === 0) {
                            return <th key={`total-label-${field.id}`}><strong>Total</strong></th>
                          }

                          const aggregatedValue = getAggregatedFieldValue(
                            previewRows,
                            field.sourceKey,
                            aggregateMode,
                          )
                          return (
                            <td key={`total-value-${field.id}`}>
                              <strong>
                                {aggregatedValue === null
                                  ? ''
                                  : formatCellValue(aggregatedValue, field.displayType)}
                              </strong>
                            </td>
                          )
                        })}
                      </tr>
                    </tfoot>
                  )}
                </>
              )
              : (
                <>
                  <thead>
                    <tr>
                      <th title="This column label and its values form the header row in vertical view.">
                        {reportData.fields[0]?.label ?? 'Column 1'}
                      </th>
                      {verticalColumns.map((column) => {
                        return <th key={`column-view-${column.key}`}>{column.headerValue}</th>
                      })}
                      {showTotals && <th>Total</th>}
                    </tr>
                  </thead>
                  <tbody>
                    {reportData.fields.slice(1).map((field) => (
                      <tr key={`row-view-${field.id}`}>
                        <th>{field.label}</th>
                        {verticalColumns.map((column) => {
                          const mappedValue = column.rows.length > 1
                            ? (() => {
                              const aggregatedValue = getAggregatedFieldValue(
                                column.rows,
                                field.sourceKey,
                                aggregateMode,
                              )
                              if (aggregatedValue === null) {
                                return getMappedValue(
                                  column.rows[0],
                                  field.sourceKey,
                                  field.displayType,
                                )
                              }

                              return formatCellValue(aggregatedValue, field.displayType)
                            })()
                            : getMappedValue(
                              column.rows[0],
                              field.sourceKey,
                              field.displayType,
                            )

                          return <td key={`${field.id}-${column.key}`}>{mappedValue}</td>
                        })}
                        {showTotals && (
                          <td>
                            <strong>
                              {(() => {
                                const aggregatedValue = getAggregatedFieldValue(
                                  previewRows,
                                  field.sourceKey,
                                  aggregateMode,
                                )
                                return aggregatedValue === null
                                  ? ''
                                  : formatCellValue(aggregatedValue, field.displayType)
                              })()}
                            </strong>
                          </td>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </>
              )}
          </table>
        </div>
      </section>
    </div>
  )
}

export default App
