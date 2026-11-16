import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import SectionTitleRow from './SectionTitleRow'

describe('SectionTitleRow', () => {
  it('renders the title without a toggle when not collapsible', () => {
    render(<SectionTitleRow title="Formulas" sectionName="formulas" contentId="x" isCollapsed={false} />)

    expect(screen.getByRole('heading', { name: 'Formulas' })).toBeInTheDocument()
    expect(screen.queryByRole('button')).not.toBeInTheDocument()
  })

  it('labels the toggle by state and calls onToggleCollapsed', () => {
    const onToggle = vi.fn()
    render(
      <SectionTitleRow title="Formulas" sectionName="formulas" contentId="content" isCollapsed onToggleCollapsed={onToggle} />,
    )

    const toggle = screen.getByRole('button', { name: 'Expand formulas' })
    expect(toggle).toHaveAttribute('aria-expanded', 'false')
    expect(toggle).toHaveAttribute('aria-controls', 'content')
    fireEvent.click(toggle)
    expect(onToggle).toHaveBeenCalledTimes(1)
  })
})
