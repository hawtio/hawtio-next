import React from 'react';
import { render } from '@testing-library/react';
import Hawtio from './Hawtio';

test('renders page', () => {
  const { getByText } = render(<Hawtio />);
  const hawtio = getByText(/Hello/i);
  expect(hawtio).toBeInTheDocument();
});
