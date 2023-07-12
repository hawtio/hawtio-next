import { render, screen, waitFor, within } from '@testing-library/react'
import { CamelContext } from '@hawtiosrc/plugins/camel/context'
import { MBeanNode, MBeanTree } from '@hawtiosrc/plugins'
import { EndpointStatistics } from '@hawtiosrc/plugins/camel/endpoints/endpoints-service'
import userEvent from '@testing-library/user-event'
import { EndpointStats } from '@hawtiosrc/plugins/camel/endpoints/EndpointsStats'

function getMockedStatistics(): EndpointStatistics[] {
  return [
    { url: 'urlA', routeId: 'ID0', static: false, dynamic: false, hits: 1, direction: 'in1', index: 0 },
    { url: 'urlB', routeId: 'ID1', static: false, dynamic: false, hits: 2, direction: 'in2', index: 1 },
    { url: 'urlC', routeId: 'ID2', static: false, dynamic: false, hits: 3, direction: 'out1', index: 2 },
    { url: 'urlD', routeId: 'ID3', static: true, dynamic: false, hits: 4, direction: 'out2', index: 3 },
    { url: 'urlE', routeId: 'ID4', static: true, dynamic: true, hits: 5, direction: 'out3', index: 4 },
  ]
}

jest.mock('@hawtiosrc/plugins/camel/endpoints/endpoints-service', () => ({
  getEndpointStatistics: jest.fn().mockResolvedValue(getMockedStatistics()),
}))
describe('EndpointStats.tsx', () => {
  const renderWithContext = () => {
    return render(
      <CamelContext.Provider
        value={{
          selectedNode: new MBeanNode(null, 'mock', false),
          tree: {} as MBeanTree,
          setSelectedNode: jest.fn(),
        }}
      >
        <EndpointStats />
      </CamelContext.Provider>,
    )
  }

  test('Component renders correctly', async () => {
    renderWithContext()
    expect(screen.getByText('Endpoints (in/out)')).toBeInTheDocument()
  })

  test('Statistics are displayed correctly', async () => {
    renderWithContext()

    for (const stat of getMockedStatistics()) {
      await waitFor(() => {
        expect(screen.getByText(stat.url)).toBeInTheDocument()
      })
      expect(screen.getByText(stat.hits)).toBeInTheDocument()
      expect(screen.getByText(stat.routeId)).toBeInTheDocument()
      expect(screen.getByText(stat.direction)).toBeInTheDocument()
    }
  })

  test('Statistics can be filtered', async () => {
    renderWithContext()
    const input = within(screen.getByTestId('filter-input')).getByRole('textbox')

    const statistic = getMockedStatistics()[2] as EndpointStatistics
    expect(input).toBeInTheDocument()
    await userEvent.type(input, statistic.url)

    expect(input).toHaveValue(statistic.url)
    expect(screen.getByText(statistic.url)).toBeInTheDocument()
    expect(screen.queryByText('urlA')).not.toBeInTheDocument()

    expect(screen.getByText(statistic.hits)).toBeInTheDocument()
    expect(screen.getByText(statistic.routeId)).toBeInTheDocument()

    // search acording different attribute
    const dropdown = screen.getByTestId('attribute-select-toggle')
    await userEvent.click(dropdown)
    await userEvent.click(screen.getAllByText('Route ID')[0] as HTMLElement)

    await userEvent.clear(input)
    await userEvent.type(input, statistic.url)
    expect(screen.getByText('No results found.')).toBeInTheDocument()

    await userEvent.clear(input)
    await userEvent.type(input, statistic.routeId)
    await waitFor(() => {
      expect(screen.getByText(statistic.url)).toBeInTheDocument()
    })

    expect(screen.queryByText('urlA')).not.toBeInTheDocument()
    expect(screen.getByText(statistic.routeId)).toBeInTheDocument()
  })

  test('Statistics can be sorted', async () => {
    renderWithContext()
    const testSortingHeaders = async (header: string, index: number, expected: string) => {
      const element = within(screen.getByTestId(header)).getByRole('button')

      await userEvent.click(element)
      //for desc ordering it's necessary to click again
      await userEvent.click(element)
      expect(within(screen.getByTestId('row' + index)).getAllByText(expected)[0]).toBeInTheDocument()
    }

    await waitFor(() => {
      expect(screen.getByText('urlA')).toBeInTheDocument()
    })
    await testSortingHeaders('url-header', 0, 'urlE')
    await testSortingHeaders('routeId-header', 4, 'ID0')
    await testSortingHeaders('direction-header', 0, 'out3')
    await testSortingHeaders('hits-header', 0, '5')
    await testSortingHeaders('dynamic-header', 0, 'true')
    await testSortingHeaders('static-header', 0, 'true')
  })
})
