import { render, screen, waitFor } from '@testing-library/react'
import { BrowserRouter } from 'react-router-dom-v5-compat'
import { HawtioLogin } from './HawtioLogin'

describe('HawtioLogin', () => {
  test('renders page', async () => {
    render(
      <BrowserRouter>
        <HawtioLogin />
      </BrowserRouter>,
    )
    await waitFor(() => {
      const example = screen.queryByText('Log in to your account')
      expect(example).toBeInTheDocument()
    })
  })
})
