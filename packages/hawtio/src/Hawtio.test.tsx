import { render, screen, waitFor } from '@testing-library/react'
import { HawtioContextProvider } from './context'
import { Hawtio } from './Hawtio'

describe('Hawtio', () => {
  test('renders page', async () => {
    render(
      <HawtioContextProvider>
        <Hawtio />
      </HawtioContextProvider>
    )
    await waitFor(() => {
      const example = screen.queryByText('Hawtio')
      expect(example).toBeInTheDocument()
    })
  })
})
