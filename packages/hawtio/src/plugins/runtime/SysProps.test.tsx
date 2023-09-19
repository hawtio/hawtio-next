import { render, screen, waitFor, within } from '@testing-library/react'
import { SysProps } from './SysProps'
import { SystemProperty } from './types'
import { runtimeService } from './runtime-service'
import userEvent from '@testing-library/user-event'

function getMockedProperties(): SystemProperty[] {
  return [
    { key: 'key1', value: 'value1' },
    { key: 'key2', value: 'value2' },
    { key: 'key3', value: 'value3' },
  ]
}

describe('SysProps.tsx', () => {
  jest.spyOn(runtimeService, 'loadSystemProperties').mockResolvedValue(getMockedProperties())
  const renderSysProps = () => {
    return render(<SysProps />)
  }

  test('System properties are displayed correctly', async () => {
    renderSysProps()
    await waitFor(() => {
      expect(screen.getByText('value3')).toBeInTheDocument()
    })
    for (const property of getMockedProperties()) {
      expect(screen.getByText(property.key)).toBeInTheDocument()
      expect(screen.getByText(property.value)).toBeInTheDocument()
    }
  })

  test('Statistics can be filtered', async () => {
    renderSysProps()
    const input = within(screen.getByTestId('filter-input')).getByRole('textbox')

    const prop = getMockedProperties()[2] as SystemProperty
    expect(input).toBeInTheDocument()
    await userEvent.type(input, prop.key)

    expect(input).toHaveValue(prop.key)
    expect(screen.getByText(prop.key)).toBeInTheDocument()
    expect(screen.queryByText('key1')).not.toBeInTheDocument()
    expect(screen.getByText(prop.value)).toBeInTheDocument()

    // search according the value
    const dropdown = screen.getByTestId('attribute-select-toggle')
    await userEvent.click(dropdown)
    await userEvent.click(screen.getAllByText('Value')[0] as HTMLElement)

    await userEvent.clear(input)
    await userEvent.type(input, prop.key)
    expect(screen.getByText('No results found.')).toBeInTheDocument()

    await userEvent.clear(input)
    await userEvent.type(input, prop.value)
    await waitFor(() => {
      expect(screen.getByText(prop.key)).toBeInTheDocument()
    })

    expect(screen.queryByText('key1')).not.toBeInTheDocument()
    expect(screen.getByText(prop.value)).toBeInTheDocument()
  })

  test('Properties can be sorted', async () => {
    renderSysProps()
    const changeOrder = async (header: string) => {
      const element = within(screen.getByTestId(header)).getByRole('button')

      expect(element).toBeInTheDocument()

      await userEvent.click(element)
      await userEvent.click(element)
    }
    const testProperty = (index: number, expected: SystemProperty) => {
      expect(within(screen.getByTestId('row' + index)).getAllByText(expected.key)[0]).toBeInTheDocument()
      expect(within(screen.getByTestId('row' + index)).getAllByText(expected.value)[0]).toBeInTheDocument()
    }

    await waitFor(() => {
      expect(screen.getByText('value1')).toBeInTheDocument()
    })
    await changeOrder('name-header')
    testProperty(0, getMockedProperties()[2] as SystemProperty)
    testProperty(2, getMockedProperties()[0] as SystemProperty)
    await changeOrder('value-header')
    testProperty(0, getMockedProperties()[2] as SystemProperty)
    //  testProperty(2, getMockedProperties()[0] as SystemProperty)
  })
})
