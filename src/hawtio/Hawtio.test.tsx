import { render, screen } from '@testing-library/react'
import { Hawtio } from './Hawtio'

test('renders page', () => {
  render(
    <Hawtio />
  )
  const example = screen.queryByText('Hawtio')
  expect(example).toBeInTheDocument()
})
