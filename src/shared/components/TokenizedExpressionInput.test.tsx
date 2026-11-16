import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import TokenizedExpressionInput from './TokenizedExpressionInput'

describe('TokenizedExpressionInput', () => {
  it.each(['client.name', '["client.name"]', '["part}}end"]', '[""]'])(
    'inserts the unambiguous picker reference %s',
    (option) => {
      const onChange = vi.fn()
      render(<TokenizedExpressionInput id="expr" value="{{" options={[option]} onChange={onChange} />)
      fireEvent.click(screen.getByRole('button', { name: option }))
      expect(onChange).toHaveBeenCalledWith(`{{${option}}}`)
    },
  )

  it('replaces a complete token from inside a quoted key without duplicating its closing delimiter', () => {
    const onChange = vi.fn()
    const value = '{{["part}}end"]}} + 1'
    render(<TokenizedExpressionInput id="expr" value={value} options={['["part}}new"]']} onChange={onChange} />)
    const input = screen.getByRole('textbox') as HTMLInputElement
    input.setSelectionRange(10, 10)
    fireEvent.click(input)
    fireEvent.click(screen.getByRole('button', { name: '["part}}new"]' }))
    expect(onChange).toHaveBeenCalledWith('{{["part}}new"]}} + 1')
  })

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
