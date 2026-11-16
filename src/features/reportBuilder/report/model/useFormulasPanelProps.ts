import type { FormulasSectionProps } from '../../components/FormulasSection'
import { MAX_FORMULAS } from '../../config'
import { getNextSequencedName, sortFormulasByLabel } from '../../../../utils/reportBuilder'
import { getFormulaError } from '../../../../services/reportDefinition/rules'
import { useReportBuilder } from '../useReportBuilder'

type FormulasPanelProps = Omit<FormulasSectionProps, 'isCollapsed' | 'onToggleCollapsed'>

// Formulas: its props and every formula action (add, edit, rename, remove).
export function useFormulasPanelProps(): FormulasPanelProps {
  const { state, computed } = useReportBuilder()
  const { ui, dispatchUi, formulas, setFormulas, newFormula, setNewFormula, setFormulaError, setEditingFormulaError } = state
  const { editingFormula } = ui
  const fieldKeys = state.sourceColumns.map((column) => column.key)

  const setIsAddingFormula = (value: boolean) => dispatchUi({ type: 'set', changes: { isAddingFormula: value } })

  function stopEditingFormula(): void {
    dispatchUi({ type: 'stopEditFormula' })
    setEditingFormulaError('')
  }

  function addFormula(): void {
    if (formulas.length >= MAX_FORMULAS) {
      setFormulaError(`Formula limit reached (${MAX_FORMULAS}).`)
      return
    }
    const candidate = { label: newFormula.label.trim(), expression: newFormula.expression.trim() }
    const validationError = getFormulaError(candidate, { existingLabels: formulas.map((formula) => formula.label), fieldKeys })
    if (validationError) {
      setFormulaError(validationError)
      return
    }

    const next = sortFormulasByLabel([...formulas, candidate])
    setFormulas(next)
    setNewFormula({ label: getNextSequencedName('formula', next.map((formula) => formula.label)), expression: '' })
    setFormulaError('')
    setIsAddingFormula(false)
  }

  // Renaming a formula also repoints the columns that show it.
  function saveEditingFormula(): void {
    if (!editingFormula) return
    const { originalLabel, draft } = editingFormula
    const candidate = { label: draft.label.trim(), expression: draft.expression.trim() }
    const otherLabels = formulas.map((formula) => formula.label).filter((label) => label.toLowerCase() !== originalLabel.toLowerCase())
    const validationError = getFormulaError(candidate, { existingLabels: otherLabels, fieldKeys })
    if (validationError) {
      setEditingFormulaError(validationError)
      return
    }

    setFormulas((previous) => sortFormulasByLabel(previous.map((formula) => (formula.label === originalLabel ? candidate : formula))))
    const originalKey = originalLabel.toLowerCase()
    state.setFields((previous) => previous.map((field) => (field.sourceKey.toLowerCase() !== originalKey ? field : {
      ...field,
      sourceKey: candidate.label,
      label: field.label === originalLabel ? candidate.label : field.label,
    })))
    stopEditingFormula()
    setFormulaError('')
  }

  return {
    formulas,
    isAddingFormula: ui.isAddingFormula,
    maxFormulas: MAX_FORMULAS,
    newFormula,
    formulaError: state.formulaError,
    editingFormulaLabel: editingFormula?.originalLabel ?? null,
    editingFormula: editingFormula?.draft ?? null,
    editingFormulaError: state.editingFormulaError,
    formulaTokenOptions: computed.formulaTokenOptions,
    onStartAddFormula: () => {
      setFormulaError('')
      setIsAddingFormula(true)
    },
    onCancelAddFormula: () => {
      setFormulaError('')
      setIsAddingFormula(false)
    },
    onSetNewFormulaLabel: (value: string) => setNewFormula((previous) => ({ ...previous, label: value })),
    onSetNewFormulaExpression: (value: string) => setNewFormula((previous) => ({ ...previous, expression: value })),
    onAddFormula: addFormula,
    onStartEditFormula: (formula) => {
      dispatchUi({ type: 'startEditFormula', formula })
      setEditingFormulaError('')
    },
    onCancelEditFormula: stopEditingFormula,
    onSaveEditFormula: saveEditingFormula,
    onRemoveFormula: (label: string) => {
      setFormulas((previous) => previous.filter((formula) => formula.label !== label))
      if (editingFormula?.originalLabel === label) stopEditingFormula()
      setFormulaError('')
    },
    onSetEditingFormulaLabel: (value: string) => dispatchUi({ type: 'patchEditFormula', changes: { label: value } }),
    onSetEditingFormulaExpression: (value: string) => dispatchUi({ type: 'patchEditFormula', changes: { expression: value } }),
  }
}
