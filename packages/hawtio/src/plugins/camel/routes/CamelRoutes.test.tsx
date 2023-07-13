import { MBeanNode, MBeanTree } from '@hawtiosrc/plugins'
import { CamelContext } from '@hawtiosrc/plugins/camel/context'
import { CamelRoutes } from '@hawtiosrc/plugins/camel/routes/CamelRoutes'
import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { CamelRoute } from './route'
import { routesService } from './routes-service'

function getMockedRoutes(): CamelRoute[] {
  return [
    new CamelRoute(new MBeanNode(null, 'route1', false), 'route1', 'start', '1h1', 1, 11, 111, 1111, 11111, 111111),
    new CamelRoute(new MBeanNode(null, 'route2', false), 'route2', 'started', '2h2', 2, 22, 222, 2222, 22222, 222222),
    new CamelRoute(new MBeanNode(null, 'route3', false), 'route3', 'stopped', '3h3', 3, 33, 333, 3333, 33333, 333333),
  ]
}

describe('CamelRoutes.tsx', () => {
  beforeEach(() => {
    jest.spyOn(routesService, 'getRoutesAttributes').mockResolvedValue(getMockedRoutes())
  })
  const renderWithContext = () => {
    return render(
      <CamelContext.Provider
        value={{
          selectedNode: new MBeanNode(null, 'mock', false),
          tree: {} as MBeanTree,
          setSelectedNode: jest.fn(),
        }}
      >
        <CamelRoutes />
      </CamelContext.Provider>,
    )
  }

  test('CamelRoutes component is rendered', async () => {
    renderWithContext()
    await waitFor(() => {
      expect(screen.getByTestId('camel-routes-table')).toBeInTheDocument()

      getMockedRoutes().forEach((r, index) => {
        const row = screen.getByTestId('row' + index)
        expect(within(row).getByText(r.routeId)).toBeInTheDocument()
        expect(within(row).getByText(r.state ?? '-11')).toBeInTheDocument()
        expect(within(row).getByText(r.meanProcessingTime)).toBeInTheDocument()
        expect(within(row).getByText(r.failuresHandled)).toBeInTheDocument()
        expect(within(row).getByText(r.uptime)).toBeInTheDocument()
        expect(within(row).getByText(r.exchangesTotal)).toBeInTheDocument()
        expect(within(row).getByText(r.exchangesCompleted)).toBeInTheDocument()
        expect(within(row).getByText(r.exchangesFailed)).toBeInTheDocument()
        expect(within(row).getByText(r.exchangesInflight)).toBeInTheDocument()
      })
    })
  })

  test('Statistics can be sorted', async () => {
    renderWithContext()
    const testSorting = async (header: string, index: number, expected: string) => {
      const element = within(screen.getByTestId(header)).getByRole('button')

      await userEvent.click(element)
      //for desc ordering it's necessary to click again
      await userEvent.click(element)
      expect(within(screen.getByTestId('row' + index)).getByText(expected)).toBeInTheDocument()
    }

    await waitFor(() => {
      expect(screen.getByTestId('name-header')).toBeInTheDocument()
    })
    await testSorting('name-header', 0, 'route3')
    await testSorting('state-header', 2, 'start')
    await testSorting('completed-header', 0, '3')
    await testSorting('failed-header', 2, '11')
    await testSorting('handled-header', 0, '33333')
    await testSorting('total-header', 2, '1111')
    await testSorting('inflight-header', 0, '333')
    await testSorting('meantime-header', 2, '11111')
  })
})
