import {
  Button,
  Divider,
  Dropdown,
  DropdownItem,
  DropdownList,
  MenuToggle,
  MenuToggleElement,
} from '@patternfly/react-core'
import { Modal } from '@patternfly/react-core/deprecated'
import React from 'react'

export const Example3HeaderItem1: React.FunctionComponent = () => {
  const [isModalOpen, setIsModalOpen] = React.useState(false)

  const handleModalToggle = () => {
    setIsModalOpen(!isModalOpen)
  }

  return (
    <React.Fragment>
      <Button id='example3-header-item1-button' variant='primary' onClick={handleModalToggle}>
        Click Me!
      </Button>

      <Modal
        id='example3-header-item1-modal'
        title='Basic modal'
        isOpen={isModalOpen}
        onClose={handleModalToggle}
        actions={[
          <Button key='confirm' variant='primary' onClick={handleModalToggle}>
            Confirm
          </Button>,
          <Button key='cancel' variant='link' onClick={handleModalToggle}>
            Cancel
          </Button>,
        ]}
      >
        Hello World! I am part of the Example3 plugin
      </Modal>
    </React.Fragment>
  )
}

export const Example3HeaderItem2: React.FunctionComponent = () => {
  const [isOpen, setIsOpen] = React.useState(false)

  const onToggle = () => {
    setIsOpen(!isOpen)
  }

  const onFocus = () => {
    const element = document.getElementById('toggle-basic')
    element?.focus()
  }

  const onSelect = () => {
    setIsOpen(false)
    onFocus()
  }
  return (
    <Dropdown
      id='example3-header-item2-dropdown'
      onSelect={onSelect}
      onOpenChange={setIsOpen}
      toggle={(toggleRef: React.Ref<MenuToggleElement>) => (
        <MenuToggle variant='plain' id='example3-header-item2-dropdown-toggle' ref={toggleRef} onClick={onToggle}>
          Example 3
        </MenuToggle>
      )}
      isOpen={isOpen}
    >
      <DropdownList>
        <DropdownItem key='link'>Link</DropdownItem>
        <DropdownItem key='action' component='button'>
          Action
        </DropdownItem>
        <DropdownItem key='disabled link' isDisabled href='www.google.com'>
          Disabled link
        </DropdownItem>
        <DropdownItem
          key='disabled action'
          isAriaDisabled
          component='button'
          tooltipProps={{ content: '  Disabled action', position: 'top' }}
        >
          Disabled action
        </DropdownItem>
        <Divider key='separator' />
        <DropdownItem key='separated link'>Separated link</DropdownItem>
        <DropdownItem key='separated action' component='button'>
          Separated action
        </DropdownItem>
      </DropdownList>
    </Dropdown>
  )
}
