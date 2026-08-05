import { render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import App from './App'

vi.mock('./features/reportBuilder/ReportBuilderApp', () => {
  return {
    default: ({
      initialTableOrientation,
      initialAggregateMode,
      initialEditMode,
    }: {
      initialTableOrientation?: string
      initialAggregateMode?: string
      initialEditMode?: boolean
    }) => (
      <div data-testid="app-wrapper-props">
        {JSON.stringify({ initialTableOrientation, initialAggregateMode, initialEditMode })}
      </div>
    ),
  }
})

describe('App wrapper', () => {
  it('forwards props to ReportBuilderApp', () => {
    render(
      <App
        initialTableOrientation="vertical"
        initialAggregateMode="sum"
        initialEditMode
      />,
    )

    expect(screen.getByTestId('app-wrapper-props')).toHaveTextContent(
      '{"initialTableOrientation":"vertical","initialAggregateMode":"sum","initialEditMode":true}',
    )
  })
})
