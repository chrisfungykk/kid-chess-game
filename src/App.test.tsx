import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import fc from 'fast-check'
import App from './App'

describe('App', () => {
  it('renders the heading', () => {
    render(<App />)
    expect(screen.getByRole('heading')).toBeInTheDocument()
  })

  it('fast-check is working', () => {
    fc.assert(
      fc.property(fc.integer({ min: 1, max: 100 }), (n) => {
        return n >= 1 && n <= 100
      })
    )
  })
})
