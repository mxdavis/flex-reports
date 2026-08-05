import { fireEvent, render, screen, within } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import type { SeedFormula } from '../../../services/adapters'
import SeedFormulasSection from './SeedFormulasSection'

const formulas: SeedFormula[] = [
  { label: 'grossFees', expression: '{{hours}} * {{rate}}' },
]

describe('SeedFormulasSection', () => {
  it('renders formulas section with anchor id', () => {
    render(
      <SeedFormulasSection
        formulas={formulas}
        isAddingFormula={false}
        maxFormulas={25}
        newFormula={{ label: 'formula2', expression: '{{hours}}' }}
        formulaError=""
        editingFormulaLabel={null}
        editingFormula={null}
        editingFormulaError=""
        formulaTokenOptions={['hours', 'rate', '%grossFees']}
        onStartAddFormula={() => undefined}
        onCancelAddFormula={() => undefined}
        onSetNewFormulaLabel={() => undefined}
        onSetNewFormulaExpression={() => undefined}
        onAddFormula={() => undefined}
        onStartEditFormula={() => undefined}
        onCancelEditFormula={() => undefined}
        onSaveEditFormula={() => undefined}
        onRemoveFormula={() => undefined}
        onSetEditingFormulaLabel={() => undefined}
        onSetEditingFormulaExpression={() => undefined}
      />,
    )

    const heading = screen.getByRole('heading', { name: 'Formulas' })
    const section = heading.closest('section')

    expect(section).toBeTruthy()
    expect(section?.id).toBe('report-formulas')
  })

  it('forwards add-formula click', () => {
    const onStartAddFormula = vi.fn()
    const { container } = render(
      <SeedFormulasSection
        formulas={formulas}
        isAddingFormula={false}
        maxFormulas={25}
        newFormula={{ label: 'formula2', expression: '{{hours}}' }}
        formulaError=""
        editingFormulaLabel={null}
        editingFormula={null}
        editingFormulaError=""
        formulaTokenOptions={['hours', 'rate', '%grossFees']}
        onStartAddFormula={onStartAddFormula}
        onCancelAddFormula={() => undefined}
        onSetNewFormulaLabel={() => undefined}
        onSetNewFormulaExpression={() => undefined}
        onAddFormula={() => undefined}
        onStartEditFormula={() => undefined}
        onCancelEditFormula={() => undefined}
        onSaveEditFormula={() => undefined}
        onRemoveFormula={() => undefined}
        onSetEditingFormulaLabel={() => undefined}
        onSetEditingFormulaExpression={() => undefined}
      />,
    )

    const section = container.querySelector('#report-formulas')
    expect(section).toBeTruthy()
    if (!(section instanceof HTMLElement)) {
      return
    }

    fireEvent.click(within(section).getByRole('button', { name: 'Add formula' }))
    expect(onStartAddFormula).toHaveBeenCalledTimes(1)
  })
})
