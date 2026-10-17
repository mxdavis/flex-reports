import EditableCard from '../../../components/EditableCard'
import FormulaDetailEditor from '../../../components/FormulaDetailEditor'
import TokenizedExpressionInput from '../../../shared/components/TokenizedExpressionInput'
import type { ReportFormula } from '../../../services/adapters'
import SectionTitleRow from '../../../shared/components/SectionTitleRow'
import './FormulasSection.css'

export type FormulasSectionProps = {
  formulas: ReportFormula[]
  isAddingFormula: boolean
  maxFormulas: number
  newFormula: ReportFormula
  formulaError: string
  editingFormulaLabel: string | null
  editingFormula: ReportFormula | null
  editingFormulaError: string
  formulaTokenOptions: string[]
  onStartAddFormula: () => void
  onCancelAddFormula: () => void
  onSetNewFormulaLabel: (value: string) => void
  onSetNewFormulaExpression: (value: string) => void
  onAddFormula: () => void
  onStartEditFormula: (formula: ReportFormula) => void
  onCancelEditFormula: () => void
  onSaveEditFormula: (label: string) => void
  onRemoveFormula: (label: string) => void
  onSetEditingFormulaLabel: (value: string) => void
  onSetEditingFormulaExpression: (value: string) => void
  isCollapsed?: boolean
  onToggleCollapsed?: () => void
}

function FormulasSection({
  formulas,
  isAddingFormula,
  maxFormulas,
  newFormula,
  formulaError,
  editingFormulaLabel,
  editingFormula,
  editingFormulaError,
  formulaTokenOptions,
  onStartAddFormula,
  onCancelAddFormula,
  onSetNewFormulaLabel,
  onSetNewFormulaExpression,
  onAddFormula,
  onStartEditFormula,
  onCancelEditFormula,
  onSaveEditFormula,
  onRemoveFormula,
  onSetEditingFormulaLabel,
  onSetEditingFormulaExpression,
  isCollapsed = false,
  onToggleCollapsed,
}: FormulasSectionProps) {
  return (
    <section id="fr-report-formulas" className="fr-formulas-section fr-jump-target">
      <SectionTitleRow
        title="Formulas"
        sectionName="formulas"
        contentId="fr-report-formulas-content"
        isCollapsed={isCollapsed}
        onToggleCollapsed={onToggleCollapsed}
      />
      {!isCollapsed && (
        <div id="fr-report-formulas-content">
          <p
            className="fr-mapping-help fr-formula-help"
            title="Use {{fieldName}} for data fields and {{%Formula Label}} for formulas. Formula labels are case-insensitive."
          >
            Use {'{{fieldName}}'} for data fields and {'{{%Formula Label}}'} for formulas.
            {` Available formulas: ${formulas.map((formula) => formula.label).join(', ') || 'none yet'}.`}
          </p>
          {!isAddingFormula && (
            <div className="fr-add-card">
              <button
                type="button"
                onClick={onStartAddFormula}
                disabled={formulas.length >= maxFormulas}
                title="Add a new formula."
              >
                Add formula
              </button>
              <small>{formulas.length}/{maxFormulas} formulas</small>
            </div>
          )}

          {isAddingFormula && (
            <div className="fr-editor">
              <div className="fr-editor-grid">
                <label htmlFor="fr-new-formula-label">Label</label>
                <input
                  id="fr-new-formula-label"
                  type="text"
                  value={newFormula.label}
                  title="Formula label. You can reference it later as {{%Your Label}}."
                  onChange={(event) => {
                    onSetNewFormulaLabel(event.target.value)
                  }}
                />

                <label htmlFor="fr-new-formula-expression">Expression</label>
                <TokenizedExpressionInput
                  id="fr-new-formula-expression"
                  value={newFormula.expression}
                  title="Type an expression. Enter {{ to see available fields and formulas. Formula refs use {{%Label}}."
                  options={formulaTokenOptions}
                  onChange={onSetNewFormulaExpression}
                />
              </div>

              <div className="fr-editor-actions">
                <button
                  type="button"
                  onClick={onAddFormula}
                  disabled={formulas.length >= maxFormulas}
                >
                  Save formula
                </button>
                <button
                  type="button"
                  onClick={onCancelAddFormula}
                >
                  Cancel
                </button>
              </div>

              {formulaError && <p className="fr-formula-error">{formulaError}</p>}
            </div>
          )}

          <div className="fr-formula-card-list">
            {formulas.map((formula) => {
              const formulaDraft = editingFormulaLabel === formula.label ? editingFormula : null

              return (
                <EditableCard
                  key={formula.label}
                  summaryLeft={formula.label}
                  summaryRight={<code>{formula.expression}</code>}
                  detail={formulaDraft
                    ? (
                      <FormulaDetailEditor
                        formula={formulaDraft}
                        tokenOptions={formulaTokenOptions}
                        labelInputId={`fr-edit-label-${formula.label}`}
                        expressionInputId={`fr-edit-expression-${formula.label}`}
                        error={editingFormulaError}
                        onLabelChange={onSetEditingFormulaLabel}
                        onExpressionChange={onSetEditingFormulaExpression}
                      />
                    )
                    : null}
                  actions={
                    formulaDraft
                      ? (
                        <>
                          <button
                            type="button"
                            onClick={() => {
                              onSaveEditFormula(formula.label)
                            }}
                          >
                            Save
                          </button>
                          <button
                            type="button"
                            onClick={onCancelEditFormula}
                          >
                            Cancel
                          </button>
                        </>
                      )
                      : (
                        <>
                          <button
                            type="button"
                            onClick={() => {
                              onStartEditFormula(formula)
                            }}
                            title="Edit this formula."
                          >
                            Edit
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              onRemoveFormula(formula.label)
                            }}
                            title="Remove this formula from the report."
                          >
                            Remove
                          </button>
                        </>
                      )
                  }
                />
              )
            })}
          </div>
        </div>
      )}
    </section>
  )
}

export default FormulasSection
