import React from 'react'
import { Button, Dropdown, DropdownItem, DropdownSeparator, DropdownToggle, Modal } from '@patternfly/react-core'

export const ToolbarItemComp1: React.FunctionComponent = () => {
  const [isModalOpen, setIsModalOpen] = React.useState(false)

  const handleModalToggle = () => {
    setIsModalOpen(!isModalOpen)
  }

  return (
    <React.Fragment>
      <Button variant='primary' onClick={handleModalToggle}>
        Click Me!
      </Button>

      <Modal
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

export const ToolbarItemComp2: React.FunctionComponent = () => {
  const [isOpen, setIsOpen] = React.useState(false)

  const onToggle = (isOpen: boolean) => {
    setIsOpen(isOpen)
  }

  const onFocus = () => {
    const element = document.getElementById('toggle-basic')
    element?.focus()
  }

  const onSelect = () => {
    setIsOpen(false)
    onFocus()
  }

  const dropdownItems = [
    <DropdownItem key='link' tooltip='Tooltip for enabled link'>
      Link
    </DropdownItem>,
    <DropdownItem key='action' component='button' tooltip='Tooltip for enabled button'>
      Action
    </DropdownItem>,
    <DropdownItem key='disabled link' isDisabled href='www.google.com'>
      Disabled link
    </DropdownItem>,
    <DropdownItem
      key='disabled action'
      isAriaDisabled
      component='button'
      tooltip='Tooltip for disabled item'
      tooltipProps={{ position: 'top' }}
    >
      Disabled action
    </DropdownItem>,
    <DropdownSeparator key='separator' />,
    <DropdownItem key='separated link'>Separated link</DropdownItem>,
    <DropdownItem key='separated action' component='button'>
      Separated action
    </DropdownItem>,
  ]

  return (
    <Dropdown
      onSelect={onSelect}
      toggle={
        <DropdownToggle id='toggle-basic' onToggle={onToggle}>
          Plugin Example 3 Dropdown
        </DropdownToggle>
      }
      isOpen={isOpen}
      dropdownItems={dropdownItems}
    />
  )
}
