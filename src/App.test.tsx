import { render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import App from './App'

vi.mock('./features/reportBuilder/ReportBuilderApp', () => {
  return {
    default: ({ role, initialEditMode }: { role?: string, initialEditMode?: boolean }) => (
      <div data-testid="app-wrapper-props">
        {JSON.stringify({ role, initialEditMode })}
      </div>
    ),
  }
})

describe('App wrapper', () => {
  it('forwards props to ReportBuilderApp', () => {
    render(<App role="viewer" initialEditMode />)

    expect(screen.getByTestId('app-wrapper-props')).toHaveTextContent(
      '{"role":"viewer","initialEditMode":true}',
    )
  })
})
