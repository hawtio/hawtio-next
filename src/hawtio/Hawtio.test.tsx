import { render, screen } from '@testing-library/react'
import { HawtioContextProvider } from './context'
import { Hawtio } from './Hawtio'

test('renders page', () => {
  render(
    <HawtioContextProvider>
      <Hawtio />
    </HawtioContextProvider>
  )
  const example = screen.queryByText('Hawtio')
  expect(example).toBeInTheDocument()
})
