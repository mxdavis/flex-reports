import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import TokenizedExpressionInput from './TokenizedExpressionInput'

describe('TokenizedExpressionInput', () => {
  it('inserts selected token when typing trigger', () => {
    const onChange = vi.fn()
    render(
      <TokenizedExpressionInput
        id="expr"
        value="{{h"
        options={['hours', 'rate']}
        onChange={onChange}
      />,
    )

    fireEvent.click(screen.getByRole('button', { name: 'hours' }))
    expect(onChange).toHaveBeenCalledWith('{{hours}}')
  })
})
