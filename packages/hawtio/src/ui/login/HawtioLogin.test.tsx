import { render, screen, waitFor } from '@testing-library/react'
import { BrowserRouter } from 'react-router-dom-v5-compat'
import { HawtioLogin } from './HawtioLogin'

describe('HawtioLogin', () => {
  beforeEach(() => {
    fetchMock.mockResponse('')
  })

  test('renders page', async () => {
    render(
      <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <HawtioLogin />
      </BrowserRouter>,
    )
    await waitFor(() => {
      const example = screen.queryByText('Log in to your account')
      expect(example).toBeInTheDocument()
    })
  })
})
