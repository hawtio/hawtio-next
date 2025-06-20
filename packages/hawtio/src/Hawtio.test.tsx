import { render, screen, waitFor } from '@testing-library/react'
import { Hawtio } from './Hawtio'
import { FetchUserHook, userService } from './auth'

jest.mock('@hawtiosrc/plugins/shared/jolokia-service')

describe('Hawtio', () => {
  test('renders page', async () => {

    const fetchUser: FetchUserHook = async resolve => {
      resolve({ username: 'test', isLogin: true, isLoading: false })
      return true
    }
    userService.addFetchUserHook('test', fetchUser)

    render(<Hawtio />)

    await waitFor(() => {
      const title = screen.queryByText('Hawtio')
      expect(title).toBeInTheDocument()
    })
  })
})
