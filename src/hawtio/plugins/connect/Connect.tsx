import { Button, ButtonVariant, DataList, DataListAction, DataListCell, DataListItem, DataListItemCells, DataListItemRow, Dropdown, DropdownItem, DropdownPosition, ExpandableSection, KebabToggle, PageSection, PageSectionVariants, Text, TextContent, Toolbar, ToolbarContent, ToolbarItem } from '@patternfly/react-core'
import OutlinedQuestionCircleIcon from '@patternfly/react-icons/dist/esm/icons/outlined-question-circle-icon'
import PlusIcon from '@patternfly/react-icons/dist/esm/icons/plus-icon'
import React, { useContext, useState } from 'react'
import { connectService } from './connect-service'
import { Connection, DELETE } from './connections'
import { ConnectModal } from './ConnectModal'
import { ConnectContext, useConnections } from './context'

export const Connect: React.FunctionComponent = () => {
  const { connections, dispatch } = useConnections()
  console.debug(connections)

  const ConnectHint = () => (
    <ExpandableSection
      displaySize='large'
      toggleContent={
        <Text>
          <OutlinedQuestionCircleIcon /> Hint
        </Text>
      }
    >
      <Text component="p">
        This page allows you to connect to remote processes which <strong>already have a
          <a href="https://jolokia.org/agent.html" target="_blank">Jolokia agent</a> running inside them</strong>.
        You will need to know the host name, port and path of the Jolokia agent to be able to connect.
      </Text>
      <Text component="p">
        If the process you wish to connect to does not have a Jolokia agent inside, please refer to the
        <a href="http://jolokia.org/agent.html" target="_blank">Jolokia documentation</a> for how to add a JVM,
        servlet or OSGi based agent inside it.
      </Text>
      <Text component="p">
        If you are using <a href="https://developers.redhat.com/products/fuse/overview/" target="_blank">Red Hat Fuse</a>
        or <a href="http://activemq.apache.org/" target="_blank">Apache ActiveMQ</a>,
        then a Jolokia agent is included by default (use context path of Jolokia agent, usually
        <code>jolokia</code>). Or you can always just deploy hawtio inside the process (which includes the Jolokia agent,
        use Jolokia servlet mapping inside hawtio context path, usually <code>hawtio/jolokia</code>).
      </Text>
    </ExpandableSection>
  )

  const ConnectionList = () => (
    <DataList
      id="connection-list"
      aria-label="connection list"
      isCompact
    >
      {Object.entries(connections).map(([name, connection]) => (
        <ConnectionItem key={name} name={name} connection={connection} />
      ))}
    </DataList>
  )

  return (
    <ConnectContext.Provider value={{ connections, dispatch }}>
      <PageSection variant={PageSectionVariants.light}>
        <TextContent>
          <Text component="h1">Connect</Text>
          <ConnectHint />
        </TextContent>
      </PageSection>
      <PageSection variant={PageSectionVariants.light}>
        <ConnectToolbar />
        <ConnectionList />
      </PageSection>
    </ConnectContext.Provider>
  )
}

const ConnectToolbar: React.FunctionComponent = () => {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)

  const initialConnection: Connection = {
    name: '',
    scheme: 'http',
    host: '',
    port: 8080,
    path: '/hawtio/jolokia'
  }

  return (
    <Toolbar id="connect-toolbar">
      <ToolbarContent>
        <ToolbarItem>
          <Button
            variant={ButtonVariant.secondary}
            onClick={() => setIsModalOpen(!isModalOpen)}
          >
            <PlusIcon /> Add connection
          </Button>
        </ToolbarItem>
        <ToolbarItem>
          <Dropdown
            key="connect-toolbar-dropdown"
            isPlain
            isOpen={isDropdownOpen}
            toggle={<KebabToggle onToggle={() => setIsDropdownOpen(!isDropdownOpen)} />}
            dropdownItems={[
              <DropdownItem key="connect-toolbar-dropdown-import" isDisabled>
                Import connections
              </DropdownItem>,
              <DropdownItem key="connect-toolbar-dropdown-export" isDisabled>
                Export connections
              </DropdownItem>,
            ]}
          />
        </ToolbarItem>
      </ToolbarContent>
      <ConnectModal
        mode="add"
        isModalOpen={isModalOpen}
        setIsModalOpen={setIsModalOpen}
        input={initialConnection}
      />
    </Toolbar>
  )
}

type ConnectionItemProps = {
  name: string
  connection: Connection
}

const ConnectionItem: React.FunctionComponent<ConnectionItemProps> = props => {
  const { dispatch } = useContext(ConnectContext)
  const { name, connection } = props
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)

  const handleDropdownToggle = () => {
    setIsDropdownOpen(!isDropdownOpen)
  }

  const openModal = () => {
    setIsModalOpen(true)
  }

  const connect = () => {
    // TODO: impl
  }

  const deleteConnection = () => {
    dispatch({ type: DELETE, name })
  }

  return (
    <DataListItem key={`connection-${name}`} aria-labelledby={`connection ${name}`}>
      <DataListItemRow>
        <DataListItemCells
          dataListCells={[
            <DataListCell key={`connection-cell-name-${name}`}>
              <b>{name}</b>
            </DataListCell>,
            <DataListCell key={`connection-cell-url-${name}`}>
              {connectService.connectionToUrl(connection)}
            </DataListCell>
          ]}
        />
        <DataListAction
          id={`connection-actions-${name}`}
          aria-label={`connection actions ${name}`}
          aria-labelledby={`${name} connection-actions-${name}`}
        >
          <Button
            key={`connection-action-connect-${name}`}
            variant="primary"
            onClick={connect}
            isSmall
          >
            Connect
          </Button>
          <Dropdown
            key={`connection-action-dropdown-${name}`}
            isPlain
            position={DropdownPosition.right}
            isOpen={isDropdownOpen}
            toggle={<KebabToggle onToggle={handleDropdownToggle} />}
            dropdownItems={[
              <DropdownItem
                key={`connection-action-edit-${name}`}
                onClick={openModal}
              >
                Edit
              </DropdownItem>,
              <DropdownItem
                key={`connection-action-delete-${name}`}
                onClick={deleteConnection}
              >
                Delete
              </DropdownItem>,
            ]}
          />
        </DataListAction>
      </DataListItemRow>
      <ConnectModal
        mode="edit"
        isModalOpen={isModalOpen}
        setIsModalOpen={setIsModalOpen}
        input={connection}
      />
    </DataListItem>
  )
}
