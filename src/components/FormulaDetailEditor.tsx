import TokenizedExpressionInput from '../shared/components/TokenizedExpressionInput'
import type { ReportFormula } from '../services/adapters'
import './FormulaDetailEditor.css'

type FormulaDetailEditorProps = {
  formula: ReportFormula
  tokenOptions: string[]
  onLabelChange: (nextValue: string) => void
  onExpressionChange: (nextValue: string) => void
  error?: string
  labelInputId: string
  expressionInputId: string
}

function FormulaDetailEditor({
  formula,
  tokenOptions,
  onLabelChange,
  onExpressionChange,
  error,
  labelInputId,
  expressionInputId,
}: FormulaDetailEditorProps) {
  return (
    <>
      <div className="formula-item-edit-grid">
        <label htmlFor={labelInputId}>Label</label>
        <input
          id={labelInputId}
          type="text"
          value={formula.label}
          title="Formula label. References are case-insensitive and can include spaces."
          onChange={(event) => {
            onLabelChange(event.target.value)
          }}
        />

        <label htmlFor={expressionInputId}>Expression</label>
        <TokenizedExpressionInput
          id={expressionInputId}
          value={formula.expression}
          title="Type an expression. Enter {{ to see available fields and formulas. Formula refs use {{%Label}}."
          options={tokenOptions}
          onChange={onExpressionChange}
        />
      </div>
      {error && <p className="formula-error">{error}</p>}
    </>
  )
}

export default FormulaDetailEditor
