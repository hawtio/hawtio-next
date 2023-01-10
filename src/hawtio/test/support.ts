
export function mockFetch(payload: string) {
  const mockedFetch = jest.fn(() => Promise.resolve(new Response(payload)))
  global.fetch = mockedFetch;
}
