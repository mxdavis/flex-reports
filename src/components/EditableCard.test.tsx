import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import EditableCard from './EditableCard'

describe('EditableCard', () => {
  it('renders summary and actions in view mode', () => {
    render(
      <EditableCard
        summaryLeft="COLUMN 1"
        summaryRight="workDate"
        actions={<button type="button">Edit</button>}
      />,
    )

    expect(screen.getByText('COLUMN 1')).toBeInTheDocument()
    expect(screen.getByText('workDate')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Edit' })).toBeInTheDocument()
  })

  it('hides summary when detail is present by default', () => {
    render(
      <EditableCard
        summaryLeft="formula"
        summaryRight="{{hours}}"
        detail={<div>Editor</div>}
      />,
    )

    expect(screen.queryByText('formula')).not.toBeInTheDocument()
    expect(screen.getByText('Editor')).toBeInTheDocument()
  })
})
