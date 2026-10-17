import type { ReportFormula } from '../../../../services/adapters'
import type { DisplayType, ReportField } from '../../../../services/reportDefinition/types'
import { DEFAULT_CURRENCY_SYMBOL, getDefaultAggregation, MAX_FORMULAS } from '../../config'
import { getNextFormulaLabel, sortFormulasByLabel, validateFormulaInput } from '../../../../utils/reportBuilder'
import type { UiAction } from '../../state/uiState'

type HandlerArgs = {
  ui: {
    editingFieldId: string | null
    editingFieldDraft: ReportField | null
    editingFormula: ReportFormula | null
  }
  dispatchUi: (action: UiAction) => void
  reportFields: ReportField[]
  setReportFields: (updater: (previous: ReportField[]) => ReportField[]) => void
  formulas: ReportFormula[]
  setFormulas: (updater: (previous: ReportFormula[]) => ReportFormula[]) => void
  newFormula: ReportFormula
  setNewFormula: (value: ReportFormula) => void
  getPreferredDisplayType: (sourceKey: string) => DisplayType
  setFormulaError: (value: string) => void
  setEditingFormulaError: (value: string) => void
  clearEditingFormulaError: () => void
}

export function useReportBuilderHandlers(args: HandlerArgs) {
  const {
    ui,
    dispatchUi,
    reportFields,
    setReportFields,
    formulas,
    setFormulas,
    newFormula,
    setNewFormula,
    getPreferredDisplayType,
    setFormulaError,
    setEditingFormulaError,
    clearEditingFormulaError,
  } = args

  function patchEditingFieldDraft(patch: Partial<ReportField>): void {
    dispatchUi({ type: 'updateEditFieldDraft', changes: patch })
  }

  function patchEditingFormulaDraft(patch: Partial<ReportFormula>): void {
    dispatchUi({ type: 'updateEditFormula', changes: patch })
  }

  function moveField(sourceId: string, targetId: string): void {
    if (sourceId === targetId) return
    setReportFields((previous) => {
      const fromIndex = previous.findIndex((field) => field.id === sourceId)
      const toIndex = previous.findIndex((field) => field.id === targetId)
      if (fromIndex < 0 || toIndex < 0) return previous
      const nextFields = [...previous]
      const [moved] = nextFields.splice(fromIndex, 1)
      nextFields.splice(toIndex, 0, moved)
      return nextFields
    })
  }

  function handleCancelEditField(): void {
    dispatchUi({ type: 'stopEditField' })
  }

  function handleSaveEditField(fieldId: string): void {
    if (!ui.editingFieldDraft || ui.editingFieldDraft.id !== fieldId) return
    const fieldDraft = ui.editingFieldDraft

    setReportFields((previous) => previous.map((currentField) => {
      if (currentField.id !== fieldId) return currentField
      const nextSourceKey = fieldDraft.sourceKey.trim() || currentField.sourceKey
      const nextLabelInput = fieldDraft.label.trim()
      const nextLabel = nextLabelInput || currentField.label
      const currentDefaultDisplayType = getPreferredDisplayType(currentField.sourceKey)
      const didUserChangeDisplayType = fieldDraft.displayType !== currentField.displayType
      const shouldSyncDisplayType = currentField.displayType === currentDefaultDisplayType
      const nextDisplayType = didUserChangeDisplayType
        ? fieldDraft.displayType
        : (shouldSyncDisplayType
          ? getPreferredDisplayType(nextSourceKey)
          : currentField.displayType)
      const currentDefaultAggregation = getDefaultAggregation(currentField.displayType)
      const didUserChangeAggregation = fieldDraft.aggregation !== currentField.aggregation
      const shouldSyncAggregation = currentField.aggregation === currentDefaultAggregation
      const nextAggregation = fieldDraft.aggregation ?? getDefaultAggregation(nextDisplayType)
      const nextCurrencySymbol = nextDisplayType === 'currency'
        ? (fieldDraft.currencySymbol || currentField.currencySymbol || DEFAULT_CURRENCY_SYMBOL)
        : ''

      return {
        ...currentField,
        sourceKey: nextSourceKey,
        label: nextLabel,
        displayType: nextDisplayType,
        aggregation: !didUserChangeAggregation && shouldSyncAggregation
          ? getDefaultAggregation(nextDisplayType)
          : nextAggregation,
        currencySymbol: nextCurrencySymbol,
      }
    }))

    handleCancelEditField()
  }

  function handleStartEditField(field: ReportField): void {
    if (ui.editingFieldId && ui.editingFieldId !== field.id && ui.editingFieldDraft) {
      const currentField = reportFields.find((current) => current.id === ui.editingFieldId)
      const hasUnsavedChanges = currentField
        ? currentField.sourceKey !== ui.editingFieldDraft.sourceKey
          || currentField.label !== ui.editingFieldDraft.label
          || currentField.displayType !== ui.editingFieldDraft.displayType
          || currentField.aggregation !== ui.editingFieldDraft.aggregation
        : false

      if (hasUnsavedChanges) {
        const editingIndex = reportFields.findIndex((current) => current.id === ui.editingFieldId)
        const editingColumnLabel = editingIndex >= 0 ? `COLUMN ${editingIndex + 1}` : 'current column'
        const shouldSaveCurrentEdit = window.confirm(`Save changes to ${editingColumnLabel} before editing another column?`)
        if (!shouldSaveCurrentEdit) return
        handleSaveEditField(ui.editingFieldId)
      }
    }

    dispatchUi({ type: 'startEditField', field })
  }

  function handleAddFormula(): void {
    if (formulas.length >= MAX_FORMULAS) {
      setFormulaError(`Formula limit reached (${MAX_FORMULAS}).`)
      return
    }
    const candidate = { label: newFormula.label.trim(), expression: newFormula.expression.trim() }
    const validationError = validateFormulaInput(formulas, candidate)
    if (validationError) {
      setFormulaError(validationError)
      return
    }

    setFormulas((previous) => {
      const next = sortFormulasByLabel([...previous, candidate])
      setNewFormula({
        label: getNextFormulaLabel(next.map((formula) => formula.label)),
        expression: '',
      })
      return next
    })
    setFormulaError('')
    dispatchUi({ type: 'setIsAddingFormula', value: false })
  }

  function handleStartEditFormula(formula: ReportFormula): void {
    dispatchUi({ type: 'startEditFormula', label: formula.label, formula })
    clearEditingFormulaError()
  }

  function handleCancelEditFormula(): void {
    dispatchUi({ type: 'stopEditFormula' })
    clearEditingFormulaError()
  }

  function handleSaveEditFormula(originalLabel: string): void {
    if (!ui.editingFormula) return
    const candidate = {
      label: ui.editingFormula.label.trim(),
      expression: ui.editingFormula.expression.trim(),
    }

    const validationError = validateFormulaInput(formulas, candidate, { ignoreLabel: originalLabel })
    if (validationError) {
      setEditingFormulaError(validationError)
      return
    }

    setFormulas((previous) => sortFormulasByLabel(previous.map((current) => {
      return current.label === originalLabel ? candidate : current
    })))

    const normalizedOriginalLabel = originalLabel.toLowerCase()
    setReportFields((previous) => previous.map((field) => {
      if (field.sourceKey.toLowerCase() !== normalizedOriginalLabel) return field
      return { ...field, sourceKey: candidate.label, label: field.label === originalLabel ? candidate.label : field.label }
    }))

    handleCancelEditFormula()
    setFormulaError('')
  }

  return {
    patchEditingFieldDraft,
    patchEditingFormulaDraft,
    moveField,
    handleStartEditField,
    handleCancelEditField,
    handleSaveEditField,
    handleAddFormula,
    handleStartEditFormula,
    handleCancelEditFormula,
    handleSaveEditFormula,
  }
}
