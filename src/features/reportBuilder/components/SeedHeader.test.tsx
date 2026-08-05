import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import SeedHeader from './SeedHeader'

describe('SeedHeader', () => {
  it('renders heading text', () => {
    render(<SeedHeader />)
    expect(screen.getByRole('heading', { name: 'Flex Reports Seed Playground' })).toBeInTheDocument()
  })
})
