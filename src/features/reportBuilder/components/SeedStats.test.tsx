import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import SeedStats from './SeedStats'

describe('SeedStats', () => {
  it('renders summary values', () => {
    render(
      <SeedStats
        items={[
          { label: 'People (count)', value: '4' },
          { label: 'Clients (count)', value: '3' },
          { label: 'Time Entries (count)', value: '20' },
          { label: 'Total Revenue (sum)', value: '$12,600.00' },
        ]}
      />,
    )

    expect(screen.getByRole('heading', { name: 'People (count)' })).toBeInTheDocument()
    expect(screen.getByText('4')).toBeInTheDocument()
    expect(screen.getByText('$12,600.00')).toBeInTheDocument()
  })
})
