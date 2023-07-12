import { render, screen, waitFor, within } from '@testing-library/react'
import { BrowseMessages } from '@hawtiosrc/plugins/camel/endpoints/BrowseMessages'
import { CamelContext } from '@hawtiosrc/plugins/camel/context'
import { MBeanNode, MBeanTree } from '@hawtiosrc/plugins'
import { MessageData } from '@hawtiosrc/plugins/camel/endpoints/endpoints-service'
import userEvent from '@testing-library/user-event'

function getMockedMessages(): MessageData[] {
  return [
    { messageId: 'message1', body: 'Body1', headers: [{ key: 'header1', value: 'value1', type: 'string' }] },
    { messageId: 'message11', body: 'Body11', headers: [{ key: 'header1', value: '1', type: 'number' }] },
    { messageId: 'message2', body: 'Body2', headers: [{ key: 'header', value: '2', type: 'number' }] },
    { messageId: 'message3', body: 'Body3', headers: [{ key: 'header', value: '3', type: 'number' }] },
    { messageId: 'message10', body: 'Body10', headers: [{ key: 'header', value: '10', type: 'number' }] },
    { messageId: 'message20', body: 'Body20', headers: [{ key: 'header', value: '20', type: 'number' }] },
    { messageId: 'message30', body: 'Body30', headers: [{ key: 'header', value: '30', type: 'number' }] },
    {
      messageId: 'another',
      body: 'anotherBody',
      headers: [{ key: 'header', value: 'anotherHeader', type: 'string' }],
    },
  ]
}

jest.mock('@hawtiosrc/plugins/camel/endpoints/endpoints-service', () => ({
  getMessagesFromTheEndpoint: jest.fn().mockResolvedValue(getMockedMessages()),
  getEndpoints: jest.fn().mockResolvedValue([]),
}))
describe('BrowseMessages.tsx', () => {
  const renderWithContext = () => {
    return render(
      <CamelContext.Provider
        value={{
          selectedNode: new MBeanNode(null, 'mock', false),
          tree: {} as MBeanTree,
          setSelectedNode: jest.fn(),
        }}
      >
        <BrowseMessages />
      </CamelContext.Provider>,
    )
  }

  const testMessageDetails = async (message: MessageData) => {
    let headerKey = {}
    let headerValue = {}
    let headerType = {}

    await waitFor(() => {
      const messageDetails = screen.getByTestId('message-details')
      expect(messageDetails).toBeInTheDocument()
      headerKey = within(messageDetails).getByText(message.headers[0]?.key as string)
      headerValue = within(messageDetails).getByText(message.headers[0]?.value as string)
      headerType = within(messageDetails).getByText(message.headers[0]?.type as string)
    })

    expect(headerKey).toBeInTheDocument()
    expect(headerValue).toBeInTheDocument()
    expect(headerType).toBeInTheDocument()
  }

  test('Component renders correctly', async () => {
    renderWithContext()
    expect(screen.getByText('Browse Messages')).toBeInTheDocument()
  })

  test('Messages are displayed correctly', async () => {
    renderWithContext()

    for (const message of getMockedMessages()) {
      await waitFor(() => {
        expect(screen.getByText(message.messageId)).toBeInTheDocument()
      })
    }
  })

  test('Opens the message details modal', async () => {
    renderWithContext()
    const message = getMockedMessages()[0]
    let element
    await waitFor(() => {
      element = screen.getByText(message?.messageId as string)
    })
    expect(element).toBeInTheDocument()
    if (element) {
      await userEvent.click(element)
    }
    // Check if the modal is open and the message ID is displayed
    await testMessageDetails(message as MessageData)
  })

  test('Messages can be browsed from details modal', async () => {
    renderWithContext()
    const messages = getMockedMessages()
    let element
    await waitFor(() => {
      element = screen.getByText(messages[0]?.messageId as string)
    })
    expect(element).toBeInTheDocument()
    if (element) {
      await userEvent.click(element)
    }
    await waitFor(() => {
      expect(screen.getByText('Message')).toBeInTheDocument()
    })

    const testButtonActions = async (btn: string, messageIndex: number) => {
      const button = screen.getByTestId(btn)
      expect(button).toBeInTheDocument()
      await userEvent.click(button)
      await testMessageDetails(messages[messageIndex] as MessageData)
    }
    // Check if the modal is open and the message ID is displayed
    await testMessageDetails(messages[0] as MessageData)

    await testButtonActions('next-message-button', 1)
    await testButtonActions('previous-message-button', 0)
    await testButtonActions('last-message-button', 7)
    await testButtonActions('first-message-button', 0)
  })

  test('Forward Modal is displayed', async () => {
    renderWithContext()
    let element
    await waitFor(() => {
      element = screen.getByText('Forward')
    })
    expect(element).toBeInTheDocument()
    expect(element).toBeDisabled()
    // Select the first message
    await userEvent.click(screen.getAllByRole('checkbox')[1] as HTMLElement)
    expect(element).not.toBeDisabled()

    // Click on the forward button
    await userEvent.click(screen.getByText('Forward'))

    // Check if the forward modal is open
    expect(screen.getByText('Forward Messages')).toBeInTheDocument()
  })

  test('Messages selection is working', async () => {
    renderWithContext()
    let checkBoxes: HTMLElement[] = []
    await waitFor(() => {
      checkBoxes = screen.getAllByRole('checkbox')
    })

    //check select-all and test
    if (checkBoxes.length > 0) await userEvent.click(checkBoxes[0] as HTMLElement)
    checkBoxes.forEach(e => {
      expect(e).toBeChecked()
    })

    if (checkBoxes.length > 0) await userEvent.click(checkBoxes[0] as HTMLElement)
    checkBoxes.forEach(e => {
      expect(e).not.toBeChecked()
    })
    expect(checkBoxes[0]).not.toBeChecked()
    for (let i = 1; i < checkBoxes.length; i++) {
      await userEvent.click(checkBoxes[i] as HTMLElement)
    }
    expect(checkBoxes[0]).toBeChecked()
  })

  test('Messages can be filtered', async () => {
    renderWithContext()
    const input = within(screen.getByTestId('filter-input')).getByRole('textbox')

    expect(input).toBeInTheDocument()
    await userEvent.type(input, 'another')

    const checkBoxes = screen.getAllByRole('checkbox')
    expect(input).toHaveValue('another')
    expect(checkBoxes.length).toBe(2)

    expect(screen.getByText('anotherBody')).toBeInTheDocument()
    expect(screen.queryByText(getMockedMessages()[0]?.body as string)).not.toBeInTheDocument()
  })
})
