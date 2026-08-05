import type { Dispatch, SetStateAction } from 'react'
import type { SeedFormula } from '../../../../services/adapters'
import { MAX_FORMULAS } from '../../config'
import { sortFormulasByLabel } from '../../../../utils/reportBuilder'

type BuildSeedFormulasPropsArgs = {
  formulas: SeedFormula[]
  isAddingFormula: boolean
  newFormula: SeedFormula
  formulaError: string
  editingFormulaLabel: string | null
  editingFormula: SeedFormula | null
  editingFormulaError: string
  formulaTokenOptions: string[]
  setFormulaError: (value: string) => void
  setIsAddingFormula: (value: boolean) => void
  setNewFormula: Dispatch<SetStateAction<SeedFormula>>
  setFormulas: Dispatch<SetStateAction<SeedFormula[]>>
  patchEditingFormulaDraft: (patch: Partial<SeedFormula>) => void
  handleAddFormula: () => void
  handleStartEditFormula: (formula: SeedFormula) => void
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
