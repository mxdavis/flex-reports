import type { Dispatch, SetStateAction } from 'react'
import type { ReportFormula } from '../../../../services/adapters'
import { MAX_FORMULAS } from '../../config'
import { sortFormulasByLabel } from '../../../../utils/reportBuilder'

type BuildSeedFormulasPropsArgs = {
  formulas: ReportFormula[]
  isAddingFormula: boolean
  newFormula: ReportFormula
  formulaError: string
  editingFormulaLabel: string | null
  editingFormula: ReportFormula | null
  editingFormulaError: string
  formulaTokenOptions: string[]
  setFormulaError: (value: string) => void
  setIsAddingFormula: (value: boolean) => void
  setNewFormula: Dispatch<SetStateAction<ReportFormula>>
  setFormulas: Dispatch<SetStateAction<ReportFormula[]>>
  patchEditingFormulaDraft: (patch: Partial<ReportFormula>) => void
  handleAddFormula: () => void
  handleStartEditFormula: (formula: ReportFormula) => void
  handleCancelEditFormula: () => void
  handleSaveEditFormula: (label: string) => void
}

export function buildSeedFormulasProps({
  formulas,
  isAddingFormula,
  newFormula,
  formulaError,
  editingFormulaLabel,
  editingFormula,
  editingFormulaError,
  formulaTokenOptions,
  setFormulaError,
  setIsAddingFormula,
  setNewFormula,
  setFormulas,
  patchEditingFormulaDraft,
  handleAddFormula,
  handleStartEditFormula,
  handleCancelEditFormula,
  handleSaveEditFormula,
}: BuildSeedFormulasPropsArgs) {
  return {
    formulas,
    isAddingFormula,
    maxFormulas: MAX_FORMULAS,
    newFormula,
    formulaError,
    editingFormulaLabel,
    editingFormula,
    editingFormulaError,
    formulaTokenOptions,
    onStartAddFormula: () => {
      setFormulaError('')
      setIsAddingFormula(true)
    },
    onCancelAddFormula: () => {
      setFormulaError('')
      setIsAddingFormula(false)
    },
    onSetNewFormulaLabel: (value: string) => {
      setNewFormula((previous) => ({ ...previous, label: value }))
    },
    onSetNewFormulaExpression: (value: string) => {
      setNewFormula((previous) => ({ ...previous, expression: value }))
    },
    onAddFormula: handleAddFormula,
    onStartEditFormula: handleStartEditFormula,
    onCancelEditFormula: handleCancelEditFormula,
    onSaveEditFormula: handleSaveEditFormula,
    onRemoveFormula: (label: string) => {
      setFormulas((previous) => sortFormulasByLabel(previous.filter((current) => current.label !== label)))
      if (editingFormulaLabel === label) {
        handleCancelEditFormula()
      }
      setFormulaError('')
    },
    onSetEditingFormulaLabel: (value: string) => {
      patchEditingFormulaDraft({ label: value })
    },
    onSetEditingFormulaExpression: (value: string) => {
      patchEditingFormulaDraft({ expression: value })
    },
  }
}
