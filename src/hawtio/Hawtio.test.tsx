import { render, screen } from '@testing-library/react'
import React from 'react'
import { Provider } from 'react-redux'
import Hawtio from './Hawtio'
import store from './store'

test('renders page', () => {
  render(
    <Provider store={store}>
      <Hawtio />
    </Provider>)
  const example = screen.queryByText('Example 1')
  expect(example).toBeInTheDocument()
})
