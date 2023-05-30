import {
  Button,
  Dropdown,
  DropdownItem,
  KebabToggle,
  Modal,
  ModalVariant,
  Skeleton,
  Toolbar,
  ToolbarContent,
  ToolbarItem,
} from '@patternfly/react-core'
import { AsleepIcon, PlayIcon, Remove2Icon } from '@patternfly/react-icons'
import React, { useState } from 'react'
import { contextsService, ContextAttributes } from './contexts-service'
import { eventService } from '@hawtiosrc/core'
import { workspace } from '@hawtiosrc/plugins/shared'

type ContextToolbarProps = {
  contexts: ContextAttributes[]
  deleteCallback: (contexts: ContextAttributes[]) => void
}

export const ContextToolbar: React.FunctionComponent<ContextToolbarProps> = (props: ContextToolbarProps) => {
  const [isOpen, setIsOpen] = useState(false)
  const [isConfirmDeleteOpen, setIsConfirmDeleteOpen] = useState(false)
  const [isDeleting, setIsDeleting] = useState<boolean>(false)

  const onDropdownToggle = (isOpen: boolean) => {
    setIsOpen(isOpen)
  }

  const isStartEnabled = (): boolean => {
    if (props.contexts.length === 0) return false

    return props.contexts.some(ctx => {
      return ctx.state === 'Suspended'
    })
  }

  const onStartClicked = () => {
    props.contexts
      .filter(ctx => {
        return ctx.state === 'Suspended'
      })
      .forEach(ctx => {
        contextsService
          .startContext(ctx)
          .then(() => {
            eventService.notify({
              type: 'success',
              message: 'Camel context start requested',
            })
          })
          .catch((error: Error) => {
            eventService.notify({
              type: 'danger',
              message: error.message,
            })
          })
      })
  }

  const isSuspendEnabled = (): boolean => {
    if (props.contexts.length === 0) return false

    return props.contexts.some(ctx => {
      return ctx.state === 'Started'
    })
  }

  const onSuspendClicked = () => {
    for (const ctx of props.contexts) {
      if (ctx.state !== 'Started') continue

      try {
        contextsService.suspendContext(ctx)
        eventService.notify({
          type: 'success',
          message: 'Camel context suspension requested',
        })
      } catch (error) {
        eventService.notify({
          type: 'danger',
          message: error as string,
        })
      }
    }
  }

  const isDeleteEnabled = (): boolean => {
    return props.contexts.length > 0
  }

  const handleConfirmDeleteToggle = () => {
    setIsConfirmDeleteOpen(!isConfirmDeleteOpen)
  }

  const onDeleteClicked = () => {
    setIsOpen(false)
    handleConfirmDeleteToggle()
  }

  const onDeleteConfirmClicked = () => {
    setIsDeleting(true)
  }

  const deleteContexts = async () => {
    for (const ctx of props.contexts) {
      try {
        await contextsService.stopContext(ctx)
        eventService.notify({
          type: 'success',
          message: 'Camel context deleted.',
        })
      } catch (error) {
        eventService.notify({
          type: 'danger',
          message: error as string,
        })
      }
    }

    props.deleteCallback(props.contexts)
    setIsDeleting(false)
    workspace.refreshTree()
  }

  if (isDeleting) {
    deleteContexts()

    const title = 'Deleting Context' + (props.contexts.length > 1 ? 's' : '') + ' ...'
    return (
      <Modal variant={ModalVariant.small} title={title} titleIconVariant='warning' isOpen={isDeleting}>
        <Skeleton screenreaderText={title} />
      </Modal>
    )
  }

  const toolbarButtons = (
    <React.Fragment>
      <ToolbarItem>
        <Button
          variant='secondary'
          isSmall={true}
          isDisabled={!isStartEnabled()}
          icon={React.createElement(PlayIcon)}
          onClick={onStartClicked}
        >
          Start
        </Button>
      </ToolbarItem>
      <ToolbarItem>
        <Button
          variant='secondary'
          isSmall={true}
          isDisabled={!isSuspendEnabled()}
          icon={React.createElement(AsleepIcon)}
          onClick={onSuspendClicked}
        >
          Suspend
        </Button>
      </ToolbarItem>
    </React.Fragment>
  )

  const ConfirmDeleteModal = () => (
    <Modal
      variant={ModalVariant.small}
      title='Are you sure?'
      titleIconVariant='danger'
      isOpen={isConfirmDeleteOpen}
      onClose={handleConfirmDeleteToggle}
      actions={[
        <Button key='delete' variant='danger' onClick={onDeleteConfirmClicked}>
          Delete
        </Button>,
        <Button key='cancel' variant='link' onClick={handleConfirmDeleteToggle}>
          Cancel
        </Button>,
      ]}
    >
      <p>You are about to delete this Camel Context.</p>
      <p>This operation cannot be undone so please be careful.</p>
    </Modal>
  )

  const dropdownItems = [
    <DropdownItem key='action' componentID='deleteAction'>
      <Button
        variant='control'
        isSmall={true}
        isDisabled={!isDeleteEnabled()}
        icon={React.createElement(Remove2Icon)}
        onClick={onDeleteClicked}
      >
        Delete
      </Button>
    </DropdownItem>,
  ]

  return (
    <React.Fragment>
      <Toolbar id='toolbar-items'>
        <ToolbarContent>
          {toolbarButtons}
          <ToolbarItem>
            <Dropdown
              autoFocus={true}
              toggle={<KebabToggle id='toggle-kebab' onToggle={onDropdownToggle} />}
              isOpen={isOpen}
              dropdownItems={dropdownItems}
            />
          </ToolbarItem>
          <ToolbarItem variant='separator' />
        </ToolbarContent>
      </Toolbar>
      <ConfirmDeleteModal />
    </React.Fragment>
  )
}
