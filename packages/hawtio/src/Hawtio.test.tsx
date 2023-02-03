import { render, screen, waitFor } from '@testing-library/react'
import { Hawtio } from './Hawtio'

describe('Hawtio', () => {
  test('renders page', async () => {
    render(
      <Hawtio basepath='/' />
    )
    await waitFor(() => {
      const example = screen.queryByText('Hawtio')
      expect(example).toBeInTheDocument()
    })
  })
})
