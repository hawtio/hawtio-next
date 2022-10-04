import imgLogo from '@hawtio/img/hawtio-logo.svg'
import imgAvatar from '@hawtio/img/img_avatar.svg'
import { HawtioAbout } from '@hawtio/ui/about/HawtioAbout'
import { Avatar, Brand, Dropdown, DropdownItem, DropdownToggle, PageHeader, PageHeaderTools, PageHeaderToolsGroup, PageHeaderToolsItem } from '@patternfly/react-core'
import { HelpIcon } from '@patternfly/react-icons'
import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import './HawtioHeader.css'

export const HawtioHeader: React.FunctionComponent = () => {
  const [helpOpen, setHelpOpen] = useState(false)
  const [userOpen, setUserOpen] = useState(false)
  const [aboutOpen, setAboutOpen] = useState(false)

  const onHelpSelect = () => setHelpOpen(!helpOpen)
  const onUserSelect = () => setUserOpen(!userOpen)
  const onAboutToggle = () => setAboutOpen(!aboutOpen)

  const helpItems = [
    <DropdownItem key="help" component={
      <Link to='/help'>Help</Link>
    } />,
    <DropdownItem key="about" onClick={onAboutToggle}>About</DropdownItem>
  ]

  const userItems = [
    <DropdownItem key="preferences" component={
      <Link to='/preferences'>Preferences</Link>
    } />,
    <DropdownItem key="logout" component={
      <Link to='/logout'>Log out</Link>
    } />
  ]

  const HeaderTools = (
    <PageHeaderTools>
      <PageHeaderToolsGroup>
        <PageHeaderToolsItem>
          <Dropdown
            isPlain
            position="right"
            onSelect={onHelpSelect}
            toggle={
              <DropdownToggle toggleIndicator={null} onToggle={setHelpOpen}>
                <HelpIcon />
              </DropdownToggle>
            }
            isOpen={helpOpen}
            dropdownItems={helpItems}
          />
        </PageHeaderToolsItem>
      </PageHeaderToolsGroup>
      <PageHeaderToolsGroup>
        <PageHeaderToolsItem>
          <Dropdown
            isPlain
            position="right"
            onSelect={onUserSelect}
            isOpen={userOpen}
            toggle={
              <DropdownToggle
                id="hawtio-header-user-dropdown-toggle"
                onToggle={setUserOpen}
                icon={<Avatar src={imgAvatar} alt="user" />}
              >
                Hawtio User
              </DropdownToggle>
            }
            dropdownItems={userItems}
          />
        </PageHeaderToolsItem>
      </PageHeaderToolsGroup>
    </PageHeaderTools>
  )

  return (
    <React.Fragment>
      <PageHeader
        logo={<Brand src={imgLogo} alt="Hawtio Management Console" />}
        logoProps={{ href: '/' }}
        headerTools={HeaderTools}
        showNavToggle
      />
      <HawtioAbout isOpen={aboutOpen} onClose={onAboutToggle} />
    </React.Fragment>
  )
}
