import { useCallback, useEffect, useMemo, useReducer, useRef, useState } from 'react'
import {
  getBillingSeed,
  getReportRows,
  getTotalRevenue,
} from '../../services/adapters'
import type { ReportRow } from '../../services/adapters'
import type { SeedFormula } from '../../services/adapters'
import {
  generateDefaultReportData,
  loadReportData,
  saveReportData,
} from '../../services/reportDefinition/storage'
import {
  loadFormulaData,
  saveFormulaData,
} from '../../services/reportDefinition/formulaStorage'
import { evaluateFormula } from '../../services/formula/evaluateFormula'
import { getDefaultDisplayType } from '../../services/reportDefinition/displayType'
import EditModeToolbar from './components/EditModeToolbar'
import MappingPanelSection from './components/MappingPanelSection'
import SampleRowsSection from './components/SampleRowsSection'
import SeedFormulasSection from './components/SeedFormulasSection'
import SeedHeader from './components/SeedHeader'
import SeedStats from './components/SeedStats'
import {
  createInitialUiState,
  uiReducer,
} from './state/uiState'
import type { AggregateMode, ReportBuilderAppProps, TableOrientation } from './types'
import {
  formatCellValue,
  getNextFieldId,
  getNextFormulaLabel,
  sortFormulasByLabel,
  validateFormulaInput,
} from '../../utils/reportBuilder'
import type {
  DisplayType,
  ReportField,
  ReportData,
  SourceColumn,
} from '../../services/reportDefinition/types'
import './ReportBuilderApp.css'

const MAX_REPORT_COLUMNS = 15
const MIN_REPORT_COLUMNS = 1
const MAX_FORMULAS = 25
const DISPLAY_TYPE_OPTIONS: Array<{ value: DisplayType, label: string }> = [
  { value: 'currency', label: 'Currency' },
  { value: 'decimal', label: 'Decimal number' },
  { value: 'percent', label: 'Percent' },
  { value: 'date', label: 'Date' },
  { value: 'string', label: 'String' },
]

const EDIT_MODE_JUMP_TARGETS = [
  { id: 'report-columns', label: 'Columns' },
  { id: 'report-formulas', label: 'Formulas' },
  { id: 'report-chart', label: 'Chart' },
]

function ReportBuilderApp({
  initialTableOrientation = 'horizontal',
  initialAggregateMode = 'none',
  initialEditMode = false,
}: ReportBuilderAppProps) {
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
    return sortFormulasByLabel(loadFormulaData(seed.formulas))
  })
  const [newFormula, setNewFormula] = useState<SeedFormula>(() => ({
    label: getNextFormulaLabel(seed.formulas.map((formula) => formula.label)),
    expression: '{{hours}} * {{rate}}',
  }))
  const [formulaError, setFormulaError] = useState<string>('')
  const [editingFormulaError, setEditingFormulaError] = useState<string>('')
  const [ui, dispatchUi] = useReducer(
    uiReducer,
    {
      canEditReport,
      initialEditMode,
      initialTableOrientation,
      initialAggregateMode,
    },
    createInitialUiState,
  )

  const {
    isAddingFormula,
    editingFormulaLabel,
    editingFormula,
    editingFieldId,
    editingFieldDraft,
    addColumnPosition,
    isAddingColumn,
    isEditMode,
    tableOrientation,
    aggregateMode,
    draggedFieldId,
    dragOverFieldId,
    isTableFullscreen,
  } = ui

  function setIsEditMode(updater: boolean | ((previous: boolean) => boolean)): void {
    const nextValue = typeof updater === 'function' ? updater(ui.isEditMode) : updater
    dispatchUi({ type: 'setIsEditMode', value: nextValue })
  }

  function setIsAddingFormula(value: boolean): void {
    dispatchUi({ type: 'setIsAddingFormula', value })
  }

  function setEditingFormula(
    updater: SeedFormula | null | ((previous: SeedFormula | null) => SeedFormula | null),
  ): void {
    const nextValue = typeof updater === 'function' ? updater(ui.editingFormula) : updater
    dispatchUi({ type: 'setEditingFormulaState', value: nextValue })
  }

  function setIsAddingColumn(value: boolean): void {
    dispatchUi({ type: 'setIsAddingColumn', value })
  }

  function setAddColumnPosition(value: number): void {
    dispatchUi({ type: 'setAddColumnPosition', value })
  }

  function setTableOrientation(
    updater: TableOrientation | ((previous: TableOrientation) => TableOrientation),
  ): void {
    const nextValue = typeof updater === 'function' ? updater(ui.tableOrientation) : updater
    dispatchUi({ type: 'setTableOrientation', value: nextValue })
  }

  function setAggregateMode(value: AggregateMode): void {
    dispatchUi({ type: 'setAggregateMode', value })
  }

  function setDraggedFieldId(value: string | null): void {
    dispatchUi({ type: 'setDraggedFieldId', value })
  }

  function setDragOverFieldId(value: string | null): void {
    dispatchUi({ type: 'setDragOverFieldId', value })
  }

  function setIsTableFullscreen(updater: boolean | ((previous: boolean) => boolean)): void {
    const nextValue = typeof updater === 'function' ? updater(ui.isTableFullscreen) : updater
    dispatchUi({ type: 'setIsTableFullscreen', value: nextValue })
  }

  function setEditingFieldDraft(
    updater: ReportField | null | ((previous: ReportField | null) => ReportField | null),
  ): void {
    const nextValue = typeof updater === 'function' ? updater(ui.editingFieldDraft) : updater
    dispatchUi({ type: 'setEditingFieldDraftState', value: nextValue })
  }

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
    if (!ui.isTableFullscreen) {
      return
    }

    function handleEscape(event: KeyboardEvent): void {
      if (event.key === 'Escape') {
        dispatchUi({ type: 'setIsTableFullscreen', value: false })
      }
    }

    window.addEventListener('keydown', handleEscape)
    return () => {
      window.removeEventListener('keydown', handleEscape)
    }
  }, [ui.isTableFullscreen])

  useEffect(() => {
    const nextMax = reportData.fields.length + 1
    const nextPosition = Math.min(Math.max(ui.addColumnPosition, 1), nextMax)
    if (nextPosition !== ui.addColumnPosition) {
      dispatchUi({ type: 'setAddColumnPosition', value: nextPosition })
    }
  }, [reportData.fields.length, ui.addColumnPosition])

  const sourceColumnByKey = useMemo(() => {
    return new Map(sourceColumns.map((column) => [String(column.key), column]))
  }, [sourceColumns])

  const sourceOptions = useMemo(() => {
    const formulaLabels = formulas.map((formula) => formula.label)
    return Array
      .from(new Set([...sourceColumns.map((column) => String(column.key)), ...formulaLabels]))
      .sort((left, right) => left.localeCompare(right, undefined, { sensitivity: 'base' }))
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

  const previewRows = rows.slice(0, 10)
  const isHorizontalTable = tableOrientation === 'horizontal'
  const showTotals = ui.aggregateMode !== 'none'

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

  const getFormulaValue = useCallback(function getFormulaValue(
    formulaLabel: string,
    cache: Map<string, number>,
    visiting: Set<string>,
    context: Record<string, number>,
  ): number {
    const normalizedFormulaLabel = formulaLabel.toLowerCase()
    const cached = cache.get(normalizedFormulaLabel)
    if (cached !== undefined) {
      return cached
    }

    if (visiting.has(normalizedFormulaLabel)) {
      return Number.NaN
    }

    const expression = formulasByLabel.get(normalizedFormulaLabel)
    if (!expression) {
      return Number.NaN
    }

    visiting.add(normalizedFormulaLabel)
    for (const dependency of formulasByLabel.keys()) {
      if (dependency === normalizedFormulaLabel || context[dependency] !== undefined) {
        continue
      }

      context[dependency] = getFormulaValue(dependency, cache, visiting, context)
    }

    const result = evaluateFormula(expression, context)
    const value = result.ok ? result.value : Number.NaN
    cache.set(normalizedFormulaLabel, value)
    context[formulaLabel] = value
    context[normalizedFormulaLabel] = value
    visiting.delete(normalizedFormulaLabel)
    return value
  }, [formulasByLabel])

  const getMappedValue = useCallback((
    row: ReportRow,
    sourceKey: string,
    displayType: DisplayType,
  ): string => {
    const mappedColumn = sourceColumnByKey.get(sourceKey)
    if (mappedColumn) {
      return formatCellValue(row[mappedColumn.key as keyof ReportRow], displayType)
    }

    if (!formulasByLabel.has(sourceKey.toLowerCase())) {
      return ''
    }

    const context = buildBaseFormulaContext(row)
    const value = getFormulaValue(sourceKey, new Map<string, number>(), new Set<string>(), context)
    return formatCellValue(value, displayType)
  }, [formulasByLabel, getFormulaValue, sourceColumnByKey])

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
    return getFormulaValue(sourceKey, new Map<string, number>(), new Set<string>(), context)
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

    return previewRows.map((row) => ({
      key: row.id,
      headerValue: getMappedValue(row, firstField.sourceKey, firstField.displayType),
      rows: [row],
    }))
  }, [getMappedValue, previewRows, reportData.fields])

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

  function handleStartEditField(field: ReportField): void {
    if (ui.editingFieldId && ui.editingFieldId !== field.id && ui.editingFieldDraft) {
      const currentField = reportData.fields.find((current) => current.id === ui.editingFieldId)
      const hasUnsavedChanges = currentField
        ? currentField.sourceKey !== ui.editingFieldDraft.sourceKey
          || currentField.label !== ui.editingFieldDraft.label
          || currentField.displayType !== ui.editingFieldDraft.displayType
        : false

      if (hasUnsavedChanges) {
        const editingIndex = reportData.fields.findIndex((current) => current.id === ui.editingFieldId)
        const editingColumnLabel = editingIndex >= 0
          ? `COLUMN ${editingIndex + 1}`
          : 'current column'
        const shouldSaveCurrentEdit = window.confirm(
          `Save changes to ${editingColumnLabel} before editing another column?`,
        )

        if (!shouldSaveCurrentEdit) {
          return
        }

        handleSaveEditField(ui.editingFieldId)
      }
    }

    dispatchUi({ type: 'startEditField', field })
  }

  function handleCancelEditField(): void {
    dispatchUi({ type: 'stopEditField' })
  }

  function handleSaveEditField(fieldId: string): void {
    if (!ui.editingFieldDraft || ui.editingFieldDraft.id !== fieldId) {
      return
    }

    const fieldDraft = ui.editingFieldDraft

    setReportData((previous) => ({
      ...previous,
      fields: previous.fields.map((currentField) => {
        if (currentField.id !== fieldId) {
          return currentField
        }

        const nextSourceKey = fieldDraft.sourceKey.trim() || currentField.sourceKey
        const nextLabelInput = fieldDraft.label.trim()
        const nextLabel = nextLabelInput || currentField.label
        const currentDefaultDisplayType = getPreferredDisplayType(currentField.sourceKey)
        const shouldSyncDisplayType = currentField.displayType === currentDefaultDisplayType

        return {
          ...currentField,
          sourceKey: nextSourceKey,
          label: nextLabel,
          displayType: shouldSyncDisplayType
            ? getPreferredDisplayType(nextSourceKey)
            : fieldDraft.displayType,
        }
      }),
    }))

    handleCancelEditField()
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
      const next = sortFormulasByLabel([
        ...previous,
        candidate,
      ])

      setNewFormula({
        label: getNextFormulaLabel(next.map((formula) => formula.label)),
        expression: '{{hours}} * {{rate}}',
      })

      return next
    })
    setFormulaError('')
    dispatchUi({ type: 'setIsAddingFormula', value: false })
  }

  function handleStartEditFormula(formula: SeedFormula): void {
    dispatchUi({ type: 'startEditFormula', label: formula.label, formula })
    setEditingFormulaError('')
  }

  function handleCancelEditFormula(): void {
    dispatchUi({ type: 'stopEditFormula' })
    setEditingFormulaError('')
  }

  function handleSaveEditFormula(originalLabel: string): void {
    if (!ui.editingFormula) {
      return
    }

    const candidate: SeedFormula = {
      label: ui.editingFormula.label.trim(),
      expression: ui.editingFormula.expression.trim(),
    }

    const validationError = validateFormulaInput(formulas, candidate, {
      ignoreLabel: originalLabel,
    })
    if (validationError) {
      setEditingFormulaError(validationError)
      return
    }

    setFormulas((previous) => {
      const next = previous.map((current) => {
        if (current.label !== originalLabel) {
          return current
        }

        return candidate
      })

      return sortFormulasByLabel(next)
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

  function handleAddColumnAtPosition(): void {
    setReportData((previous) => {
      if (previous.fields.length >= MAX_REPORT_COLUMNS) {
        return previous
      }

      const insertionIndex = Math.min(
        Math.max(ui.addColumnPosition - 1, 0),
        previous.fields.length,
      )
      const defaultSourceKey = sourceOptions[0] ?? 'workDate'
      const nextField: ReportField = {
        id: getNextFieldId(previous.fields.map((field) => field.id)),
        label: defaultSourceKey,
        sourceKey: defaultSourceKey,
        displayType: getPreferredDisplayType(defaultSourceKey),
      }
      const nextFields = [...previous.fields]
      nextFields.splice(insertionIndex, 0, nextField)

      return {
        ...previous,
        fields: nextFields,
      }
    })
  }

  function handleJumpToSection(sectionId: string): void {
    const section = document.getElementById(sectionId)
    if (!section) {
      return
    }

    section.scrollIntoView({ behavior: 'smooth', block: 'start' })
    window.history.replaceState(null, '', `#${sectionId}`)
  }

  return (
    <div className="seed-page">
      <EditModeToolbar
        canEditReport={canEditReport}
        isEditMode={isEditMode}
        jumpTargets={EDIT_MODE_JUMP_TARGETS}
        onJumpToSection={handleJumpToSection}
        onToggle={() => {
          setIsEditMode((previous) => !previous)
          setIsAddingFormula(false)
          setIsAddingColumn(false)
          setFormulaError('')
        }}
      />

      {canEditReport && isEditMode && (
      <SeedHeader />
      )}

      {canEditReport && isEditMode && (
      <MappingPanelSection
        fields={reportData.fields}
        isAddingColumn={isAddingColumn}
        addColumnPosition={addColumnPosition}
        maxColumns={MAX_REPORT_COLUMNS}
        minColumns={MIN_REPORT_COLUMNS}
        draggedFieldId={draggedFieldId}
        dragOverFieldId={dragOverFieldId}
        editingFieldId={editingFieldId}
        editingFieldDraft={editingFieldDraft}
        sourceOptions={sourceOptions}
        displayTypeOptions={DISPLAY_TYPE_OPTIONS}
        onStartAddColumn={() => {
          setAddColumnPosition(reportData.fields.length + 1)
          setIsAddingColumn(true)
        }}
        onCancelAddColumn={() => {
          setIsAddingColumn(false)
        }}
        onAddColumnPositionChange={setAddColumnPosition}
        onSaveNewColumn={() => {
          handleAddColumnAtPosition()
          setIsAddingColumn(false)
        }}
        onMoveField={moveField}
        onStartEditField={handleStartEditField}
        onCancelEditField={handleCancelEditField}
        onSaveEditField={handleSaveEditField}
        onRemoveField={(fieldId) => {
          setReportData((previous) => {
            if (previous.fields.length <= MIN_REPORT_COLUMNS) {
              return previous
            }

            return {
              ...previous,
              fields: previous.fields.filter((current) => current.id !== fieldId),
            }
          })
          if (editingFieldId === fieldId) {
            handleCancelEditField()
          }
        }}
        onSetDraggedFieldId={setDraggedFieldId}
        onSetDragOverFieldId={setDragOverFieldId}
        onSetEditingFieldSourceKey={(value) => {
          setEditingFieldDraft((previous) => {
            if (!previous) {
              return previous
            }

            return {
              ...previous,
              sourceKey: value,
            }
          })
        }}
        onSetEditingFieldLabel={(value) => {
          setEditingFieldDraft((previous) => {
            if (!previous) {
              return previous
            }

            return {
              ...previous,
              label: value,
            }
          })
        }}
        onSetEditingFieldDisplayType={(value) => {
          setEditingFieldDraft((previous) => {
            if (!previous) {
              return previous
            }

            return {
              ...previous,
              displayType: value,
            }
          })
        }}
      />
      )}

      {canEditReport && isEditMode && (
      <SeedStats
        peopleCount={seed.personBilling.length}
        clientsCount={seed.client.length}
        timeEntriesCount={rows.length}
        totalRevenue={totalRevenue}
      />
      )}

      {canEditReport && isEditMode && (
      <SeedFormulasSection
        formulas={formulas}
        isAddingFormula={isAddingFormula}
        maxFormulas={MAX_FORMULAS}
        newFormula={newFormula}
        formulaError={formulaError}
        editingFormulaLabel={editingFormulaLabel}
        editingFormula={editingFormula}
        editingFormulaError={editingFormulaError}
        formulaTokenOptions={formulaTokenOptions}
        onStartAddFormula={() => {
          setFormulaError('')
          setIsAddingFormula(true)
        }}
        onCancelAddFormula={() => {
          setFormulaError('')
          setIsAddingFormula(false)
        }}
        onSetNewFormulaLabel={(value) => {
          setNewFormula((previous) => ({
            ...previous,
            label: value,
          }))
        }}
        onSetNewFormulaExpression={(value) => {
          setNewFormula((previous) => ({
            ...previous,
            expression: value,
          }))
        }}
        onAddFormula={handleAddFormula}
        onStartEditFormula={handleStartEditFormula}
        onCancelEditFormula={handleCancelEditFormula}
        onSaveEditFormula={handleSaveEditFormula}
        onRemoveFormula={(label) => {
          setFormulas((previous) => {
            return sortFormulasByLabel(previous.filter((current) => current.label !== label))
          })
          if (editingFormulaLabel === label) {
            handleCancelEditFormula()
          }
          setFormulaError('')
        }}
        onSetEditingFormulaLabel={(value) => {
          setEditingFormula((previous) => {
            if (!previous) {
              return previous
            }

            return {
              ...previous,
              label: value,
            }
          })
        }}
        onSetEditingFormulaExpression={(value) => {
          setEditingFormula((previous) => {
            if (!previous) {
              return previous
            }

            return {
              ...previous,
              expression: value,
            }
          })
        }}
      />
      )}

      <SampleRowsSection
        isTableFullscreen={isTableFullscreen}
        isHorizontalTable={isHorizontalTable}
        aggregateMode={aggregateMode}
        showTotals={showTotals}
        fields={reportData.fields}
        previewRows={previewRows}
        verticalColumns={verticalColumns}
        tableScrollRef={tableScrollRef}
        onAggregateModeChange={setAggregateMode}
        onToggleOrientation={() => {
          setTableOrientation((previous) => {
            return previous === 'horizontal' ? 'vertical' : 'horizontal'
          })
        }}
        onToggleFullscreen={() => {
          setIsTableFullscreen((previous) => !previous)
        }}
        getMappedValue={getMappedValue}
        getAggregatedFieldValue={getAggregatedFieldValue}
        formatValue={(value, displayType) => {
          if (value === null) {
            return ''
          }

          return formatCellValue(value, displayType)
        }}
      />
    </div>
  )
}

export default ReportBuilderApp
