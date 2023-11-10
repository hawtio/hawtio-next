import { Connection, connectService } from '@hawtiosrc/plugins/shared/connect-service'
import {
  Button,
  ButtonVariant,
  DataList,
  DataListAction,
  DataListCell,
  DataListItem,
  DataListItemCells,
  DataListItemRow,
  Dropdown,
  DropdownItem,
  DropdownPosition,
  KebabToggle,
  Modal,
  ModalVariant,
  Toolbar,
  ToolbarContent,
  ToolbarItem,
} from '@patternfly/react-core'
import { PluggedIcon, PlusIcon, UnpluggedIcon } from '@patternfly/react-icons'
import React, { useContext, useEffect, useState } from 'react'
import { DELETE } from '../connections'
import { ConnectContext } from '../context'
import { log } from '../globals'
import { ConnectionModal } from './ConnectionModal'
import { ImportModal } from './ImportModal'

export const Remote: React.FunctionComponent = () => {
  const { connections } = useContext(ConnectContext)
  log.debug('Connections:', connections)

  return (
    <React.Fragment>
      <RemoteToolbar />
      <DataList id='connection-list' aria-label='connection list' isCompact>
        {Object.entries(connections).map(([name, connection]) => (
          <ConnectionItem key={name} name={name} connection={connection} />
        ))}
      </DataList>
    </React.Fragment>
  )
}

const RemoteToolbar: React.FunctionComponent = () => {
  const { connections } = useContext(ConnectContext)
  const [isAddOpen, setIsAddOpen] = useState(false)
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)
  const [isImportModalOpen, setIsImportModalOpen] = useState(false)

  const handleAddToggle = () => {
    setIsAddOpen(!isAddOpen)
  }

  const handleImportModalToggle = () => {
    setIsImportModalOpen(!isImportModalOpen)
  }

  const exportConnections = () => {
    connectService.export(connections)
  }

  const initialConnection: Connection = {
    name: '',
    scheme: 'http',
    host: '',
    port: 8080,
    path: '/hawtio/jolokia',
  }

  return (
    <Toolbar id='connect-toolbar'>
      <ToolbarContent>
        <ToolbarItem>
          <Button variant={ButtonVariant.secondary} onClick={handleAddToggle}>
            <PlusIcon /> Add connection
          </Button>
        </ToolbarItem>
        <ToolbarItem>
          <Dropdown
            key='connect-toolbar-dropdown'
            isPlain
            isOpen={isDropdownOpen}
            toggle={<KebabToggle onToggle={() => setIsDropdownOpen(!isDropdownOpen)} />}
            dropdownItems={[
              <DropdownItem key='connect-toolbar-dropdown-import' onClick={handleImportModalToggle}>
                Import connections
              </DropdownItem>,
              <DropdownItem key='connect-toolbar-dropdown-export' onClick={exportConnections}>
                Export connections
              </DropdownItem>,
            ]}
          />
        </ToolbarItem>
      </ToolbarContent>
      <ConnectionModal mode='add' isOpen={isAddOpen} onClose={handleAddToggle} input={initialConnection} />
      <ImportModal isOpen={isImportModalOpen} onClose={handleImportModalToggle} />
    </Toolbar>
  )
}

const ConnectionItem: React.FunctionComponent<{
  name: string
  connection: Connection
}> = ({ name, connection }) => {
  const { dispatch } = useContext(ConnectContext)
  const [reachable, setReachable] = useState(false)
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)
  const [isEditOpen, setIsEditOpen] = useState(false)
  const [isConfirmDeleteOpen, setIsConfirmDeleteOpen] = useState(false)

  useEffect(() => {
    const check = () => {
      connectService.checkReachable(connection).then(result => setReachable(result))
    }
    check() // initial fire
    const timer = setInterval(check, 20000)
    return () => clearInterval(timer)
  }, [connection])

  const handleDropdownToggle = () => {
    setIsDropdownOpen(!isDropdownOpen)
  }

  const handleEditToggle = () => {
    setIsEditOpen(!isEditOpen)
  }

  const handleConfirmDeleteToggle = () => {
    setIsConfirmDeleteOpen(!isConfirmDeleteOpen)
  }

  const connect = () => {
    if (!reachable) {
      return
    }

    log.debug('Connecting:', connection)
    connectService.connect(connection)
  }

  const deleteConnection = () => {
    dispatch({ type: DELETE, name })
    handleConfirmDeleteToggle()
  }

  const ConfirmDeleteModal = () => (
    <Modal
      variant={ModalVariant.small}
      title='Delete Connection'
      titleIconVariant='danger'
      isOpen={isConfirmDeleteOpen}
      onClose={handleConfirmDeleteToggle}
      actions={[
        <Button key='delete' variant='danger' onClick={deleteConnection}>
          Delete
        </Button>,
        <Button key='cancel' variant='link' onClick={handleConfirmDeleteToggle}>
          Cancel
        </Button>,
      ]}
    >
      You are about to delete the <b>{name}</b> connection.
    </Modal>
  )

  return (
    <DataListItem key={`connection-${name}`} aria-labelledby={`connection ${name}`}>
      <DataListItemRow>
        <DataListItemCells
          dataListCells={[
            <DataListCell key={`connection-cell-icon-${name}`} isIcon>
              {reachable ? <PluggedIcon color='green' /> : <UnpluggedIcon color='red' />}
            </DataListCell>,
            <DataListCell key={`connection-cell-name-${name}`}>
              <b>{name}</b>
            </DataListCell>,
            <DataListCell key={`connection-cell-url-${name}`} width={3}>
              {connectService.connectionToUrl(connection)}
            </DataListCell>,
          ]}
        />
        <DataListAction
          id={`connection-actions-${name}`}
          aria-label={`connection actions ${name}`}
          aria-labelledby={`${name} connection-actions-${name}`}
        >
          <Button
            key={`connection-action-connect-${name}`}
            variant='primary'
            onClick={connect}
            isDisabled={!reachable}
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
              <DropdownItem key={`connection-action-edit-${name}`} onClick={handleEditToggle}>
                Edit
              </DropdownItem>,
              <DropdownItem key={`connection-action-delete-${name}`} onClick={handleConfirmDeleteToggle}>
                Delete
              </DropdownItem>,
            ]}
          />
          <ConfirmDeleteModal />
        </DataListAction>
      </DataListItemRow>
      <ConnectionModal mode='edit' isOpen={isEditOpen} onClose={handleEditToggle} input={connection} />
    </DataListItem>
  )
}
