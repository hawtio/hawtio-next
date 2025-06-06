// jest-dom adds custom jest matchers for asserting on DOM nodes.
// allows you to do things like:
// expect(element).toHaveTextContent(/react/i)
// learn more: https://github.com/testing-library/jest-dom
import '@testing-library/jest-dom'
import crypto from 'crypto'
import fetchMock from 'jest-fetch-mock'
import { TextDecoder, TextEncoder } from 'util'

fetchMock.enableMocks()

// Default mock response for every usage of fetch
fetchMock.mockResponse(req => {
  // eslint-disable-next-line no-console
  console.log('Mock fetch:', req.url)
  let res = '{}'
  switch (req.url) {
    case 'user':
      res = '"public"'
      break
    default:
  }
  return Promise.resolve(res)
})

// eslint-disable-next-line @typescript-eslint/no-explicit-any
declare const global: any

// For testing crypto
Object.defineProperty(global, 'crypto', { value: crypto.webcrypto })
global.TextEncoder = TextEncoder
global.TextDecoder = TextDecoder

// For mocking window matchMedia function
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(), // Deprecated
    removeListener: jest.fn(), // Deprecated
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
})
