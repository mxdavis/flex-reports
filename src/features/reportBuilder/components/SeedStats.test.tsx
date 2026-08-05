import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import SeedStats from './SeedStats'

describe('SeedStats', () => {
  it('renders summary values', () => {
    render(
      <SeedStats
        peopleCount={4}
        clientsCount={3}
        timeEntriesCount={20}
        totalRevenue={12600}
      />,
    )

    expect(screen.getByRole('heading', { name: 'People' })).toBeInTheDocument()
    expect(screen.getByText('4')).toBeInTheDocument()
    expect(screen.getByText('$12600.00')).toBeInTheDocument()
  })
})
