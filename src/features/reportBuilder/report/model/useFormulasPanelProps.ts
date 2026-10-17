import type { FormulasSectionProps } from '../../components/FormulasSection'
import { MAX_FORMULAS } from '../../config'
import { sortFormulasByLabel } from '../../../../utils/reportBuilder'
import { useReportBuilder } from '../useReportBuilder'

type FormulasPanelProps = Omit<FormulasSectionProps, 'isCollapsed' | 'onToggleCollapsed'>

export function useFormulasPanelProps(): FormulasPanelProps {
  const { state, computed, handlers, actions } = useReportBuilder()
  const { ui } = state

  return {
    formulas: state.formulas,
    isAddingFormula: ui.isAddingFormula,
    maxFormulas: MAX_FORMULAS,
    newFormula: state.newFormula,
    formulaError: state.formulaError,
    editingFormulaLabel: ui.editingFormulaLabel,
    editingFormula: ui.editingFormula,
    editingFormulaError: state.editingFormulaError,
    formulaTokenOptions: computed.formulaTokenOptions,
    onStartAddFormula: () => {
      state.setFormulaError('')
      actions.setIsAddingFormula(true)
    },
    onCancelAddFormula: () => {
      state.setFormulaError('')
      actions.setIsAddingFormula(false)
    },
    onSetNewFormulaLabel: (value: string) => {
      state.setNewFormula((previous) => ({ ...previous, label: value }))
    },
    onSetNewFormulaExpression: (value: string) => {
      state.setNewFormula((previous) => ({ ...previous, expression: value }))
    },
    onAddFormula: handlers.handleAddFormula,
    onStartEditFormula: handlers.handleStartEditFormula,
    onCancelEditFormula: handlers.handleCancelEditFormula,
    onSaveEditFormula: handlers.handleSaveEditFormula,
    onRemoveFormula: (label: string) => {
      state.setFormulas((previous) => sortFormulasByLabel(previous.filter((current) => current.label !== label)))
      if (ui.editingFormulaLabel === label) {
        handlers.handleCancelEditFormula()
      }
      state.setFormulaError('')
    },
    onSetEditingFormulaLabel: (value: string) => {
      handlers.patchEditingFormulaDraft({ label: value })
    },
    onSetEditingFormulaExpression: (value: string) => {
      handlers.patchEditingFormulaDraft({ expression: value })
    },
  }
}
