import {
  Divider,
  Drawer,
  DrawerActions,
  DrawerCloseButton,
  DrawerContent,
  DrawerContentBody,
  DrawerHead,
  DrawerPanelContent,
  Nav,
  NavItem,
  NavList,
  Panel,
  PanelMain,
  PanelMainBody,
  Text,
} from '@patternfly/react-core'
import { TableComposable, Tbody, Td, Th, Thead, Tr } from '@patternfly/react-table'
import React from 'react'
import { useRef, useState } from 'react'
import { MessageData } from './debug-service'

export interface MessageDrawerProps {
  messages: MessageData[]
  expanded: boolean
  setExpanded: (expanded: boolean) => void
  extraPanel?: MessageDrawerPanel
  /** Content to be rendered in the drawer */
  children?: React.ReactNode
}

export interface MessageDrawerPanel {
  id: string
  label: string
  panelFn: () => JSX.Element
}

export const MessageDrawer: React.FunctionComponent<MessageDrawerProps> = (props: MessageDrawerProps) => {
  const panelRef = useRef<HTMLDivElement | null>(null)
  const [activePanelTab, setActivePanelTab] = useState<string>('msg-panel-tab-header')

  const onSelectTab = (result: { itemId: number | string }) => {
    setActivePanelTab(result.itemId as string)
  }

  const onPanelExpand = () => {
    panelRef.current && panelRef.current.focus()
  }

  const onPanelCloseClick = () => {
    props.setExpanded(false)
  }

  const panelHeaderTab = (): JSX.Element => {
    if (!props.messages || props.messages.length === 0) return <em key='header-no-messages'>No Messages</em>

    const message = props.messages[0]
    if (!message) return <em key='header-no-messages'>No Messages</em>

    return (
      <TableComposable key={'header-' + message.uid} aria-label='Header table' variant='compact'>
        <Thead>
          <Tr>
            <Th>Key</Th>
            <Th>Value</Th>
          </Tr>
        </Thead>
        <Tbody>
          {Object.entries(message.headers).map(([key, value]) => (
            <Tr key={key}>
              <Td dataLabel='Key'>{key}</Td>
              <Td dataLabel='Value'>{value}</Td>
            </Tr>
          ))}
        </Tbody>
      </TableComposable>
    )
  }

  const panelBodyTab = (): JSX.Element => {
    if (!props.messages || props.messages.length === 0) return <em key='body-no-messages'>No Messages</em>

    const message = props.messages[0]
    if (!message) return <em key='body-no-messages'>No Messages</em>
    if (message.body === '[Body is null]') return <em key={'body-' + message.uid}>No Body</em>

    return <p key={'body-' + message.uid}>{message.body}</p>
  }

  const corePanels: MessageDrawerPanel[] = [
    { id: 'msg-panel-tab-header', label: 'Header', panelFn: panelHeaderTab },
    { id: 'msg-panel-tab-body', label: 'Body', panelFn: panelBodyTab },
  ]

  const drawerPanels = (): MessageDrawerPanel[] => {
    const panels = [...corePanels]
    if (props.extraPanel) panels.push(props.extraPanel)

    return panels
  }

  const panelNavItems = (): JSX.Element[] => {
    const panels: JSX.Element[] = []
    for (const drawerPanel of drawerPanels()) {
      panels.push(
        <NavItem
          preventDefault
          key={drawerPanel.id}
          itemId={drawerPanel.id}
          isActive={activePanelTab === drawerPanel.id}
          id={drawerPanel.id}
        >
          {drawerPanel.label}
        </NavItem>,
      )
    }
    return panels
  }

  const panelContent = (
    <DrawerPanelContent>
      <DrawerHead>
        <div tabIndex={props.expanded ? 0 : -1} ref={panelRef}>
          <Text>
            <em>{props.messages && props.messages.length > 0 ? props.messages[0]?.uid : ''}</em>
          </Text>
          <Nav
            onSelect={onSelectTab}
            variant='horizontal'
            theme='light'
            aria-label='Show Header or Body Debug Info Table'
          >
            <NavList>{panelNavItems()}</NavList>
          </Nav>
          <Divider />
        </div>
        <DrawerActions>
          <DrawerCloseButton onClick={onPanelCloseClick} />
        </DrawerActions>
      </DrawerHead>
      <Panel isScrollable>
        <PanelMain>
          <PanelMainBody>{drawerPanels().map(panel => activePanelTab === panel.id && panel.panelFn())}</PanelMainBody>
        </PanelMain>
      </Panel>
    </DrawerPanelContent>
  )

  return (
    <Drawer isExpanded={props.expanded} onExpand={onPanelExpand} position='left'>
      <DrawerContent panelContent={panelContent}>
        <DrawerContentBody>{props.children}</DrawerContentBody>
      </DrawerContent>
    </Drawer>
  )
}
