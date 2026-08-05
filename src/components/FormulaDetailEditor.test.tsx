import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import FormulaDetailEditor from './FormulaDetailEditor'

describe('FormulaDetailEditor', () => {
  it('calls callbacks and renders errors', () => {
    const onLabelChange = vi.fn()
    const onExpressionChange = vi.fn()

    render(
      <FormulaDetailEditor
        formula={{ label: 'Gross', expression: '{{hours}} * {{rate}}' }}
        tokenOptions={['hours', 'rate']}
        onLabelChange={onLabelChange}
        onExpressionChange={onExpressionChange}
        error="Invalid formula"
        labelInputId="label"
        expressionInputId="expression"
      />,
    )

    fireEvent.change(screen.getByLabelText('Label'), { target: { value: 'Net' } })
    expect(onLabelChange).toHaveBeenCalledWith('Net')

    fireEvent.change(screen.getByLabelText('Expression'), { target: { value: '{{hours}}' } })
    expect(onExpressionChange).toHaveBeenCalledWith('{{hours}}')

    expect(screen.getByText('Invalid formula')).toBeInTheDocument()
  })
})
