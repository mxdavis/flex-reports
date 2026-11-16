import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import GettingStarted, { type GettingStartedProps } from './GettingStarted'

function renderGettingStarted(overrides: Partial<GettingStartedProps> = {}) {
  const props: GettingStartedProps = {
    fields: [{ key: 'client.name', label: 'client.name' }, { key: 'hours', label: 'hours' }],
    selectedKeys: [],
    rowCount: 27,
    canAddMore: true,
    onToggleField: vi.fn(),
    onDone: vi.fn(),
    ...overrides,
  }
  render(<GettingStarted {...props} />)
  return props
}

describe('GettingStarted', () => {
  it('lists every field with how many rows loaded, and no Done button while the report is blank', () => {
    renderGettingStarted()
    expect(screen.getByRole('heading', { name: 'Getting started' })).toBeInTheDocument()
    expect(screen.getByText(/27 rows loaded/)).toBeInTheDocument()
    expect(screen.getByRole('checkbox', { name: 'client.name' })).not.toBeChecked()
    expect(screen.queryByRole('button', { name: 'Done' })).toBeNull()
  })

  it('ticks fields and closes with Done once there are columns', () => {
    const props = renderGettingStarted({ selectedKeys: ['hours'] })
    expect(screen.getByRole('checkbox', { name: 'hours' })).toBeChecked()
    fireEvent.click(screen.getByRole('checkbox', { name: 'client.name' }))
    expect(props.onToggleField).toHaveBeenCalledWith('client.name')
    fireEvent.click(screen.getByRole('button', { name: 'Done' }))
    expect(props.onDone).toHaveBeenCalled()
  })

  it('stops adding at the column limit but still lets ticked fields be removed', () => {
    renderGettingStarted({ selectedKeys: ['hours'], canAddMore: false })
    expect(screen.getByRole('checkbox', { name: 'client.name' })).toBeDisabled()
    expect(screen.getByRole('checkbox', { name: 'hours' })).toBeEnabled()
  })
})
