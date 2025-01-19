import { render, screen, waitFor } from '@testing-library/react'
import { BrowserRouter } from '@hawtiosrc/virtual-router'
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
