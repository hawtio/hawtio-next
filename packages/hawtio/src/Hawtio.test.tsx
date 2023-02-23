import { render, screen, waitFor } from '@testing-library/react'
import { Hawtio } from './Hawtio'

describe('Hawtio', () => {
  test('renders page', async () => {
    render(<Hawtio />)

    await waitFor(() => {
      const title = screen.queryByText('Hawtio')
      expect(title).toBeInTheDocument()
    })
  })
})
