import { render, screen, waitFor, within } from '@testing-library/react'
import { CamelContext } from '@hawtiosrc/plugins/camel/context'
import { MBeanNode, MBeanTree } from '@hawtiosrc/plugins'
import { CamelRoute, routesService } from '@hawtiosrc/plugins/camel/routes-service'
import { CamelRoutes } from '@hawtiosrc/plugins/camel/routes/CamelRoutes'
import userEvent from '@testing-library/user-event'

function getMockedRoutes(): CamelRoute[] {
  return [
    {
      objectName: '',
      RouteId: 'route1',
      Uptime: '1h1',
      ExchangesCompleted: 1,
      ExchangesFailed: 11,
      ExchangesInflight: 111,
      ExchangesTotal: 1111,
      FailuresHandled: 11111,
      State: 'start',
      MeanProcessingTime: 111111,
    },
    {
      objectName: '',
      RouteId: 'route2',
      Uptime: '2h2',
      ExchangesCompleted: 2,
      ExchangesFailed: 22,
      ExchangesInflight: 222,
      ExchangesTotal: 2222,
      FailuresHandled: 22222,
      State: 'started',
      MeanProcessingTime: 222222,
    },
    {
      objectName: '',
      RouteId: 'route3',
      Uptime: '3h3',
      ExchangesCompleted: 3,
      ExchangesFailed: 33,
      ExchangesInflight: 333,
      ExchangesTotal: 3333,
      FailuresHandled: 33333,
      State: 'stopped',
      MeanProcessingTime: 333333,
    },
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
        expect(within(row).getByText(r.RouteId)).toBeInTheDocument()
        expect(within(row).getByText(r.State ?? '-11')).toBeInTheDocument()
        expect(within(row).getByText(r.MeanProcessingTime)).toBeInTheDocument()
        expect(within(row).getByText(r.FailuresHandled)).toBeInTheDocument()
        expect(within(row).getByText(r.Uptime)).toBeInTheDocument()
        expect(within(row).getByText(r.ExchangesTotal)).toBeInTheDocument()
        expect(within(row).getByText(r.ExchangesCompleted)).toBeInTheDocument()
        expect(within(row).getByText(r.ExchangesFailed)).toBeInTheDocument()
        expect(within(row).getByText(r.ExchangesInflight)).toBeInTheDocument()
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
