import { userService } from '@hawtiosrc/auth'
import { DEFAULT_APP_NAME, useHawtconfig } from '@hawtiosrc/core'
import { hawtioLogo, userAvatar } from '@hawtiosrc/img'
import { HawtioAbout } from '@hawtiosrc/ui/about'
import {
  Avatar,
  Brand,
  Dropdown,
  DropdownItem,
  DropdownToggle,
  Masthead,
  MastheadBrand,
  MastheadContent,
  MastheadMain,
  MastheadToggle,
  PageToggleButton,
  Toolbar,
  ToolbarContent,
  ToolbarGroup,
  ToolbarItem,
} from '@patternfly/react-core'
import { BarsIcon, HelpIcon } from '@patternfly/react-icons'
import React, { useContext, useState } from 'react'
import { Link } from 'react-router-dom'
import { PageContext } from './context'
import './HawtioHeader.css'

export const HawtioHeader: React.FunctionComponent = () => {
  const [navOpen, setNavOpen] = useState(true)

  const onNavToggle = () => setNavOpen(!navOpen)

  return (
    <React.Fragment>
      <Masthead display={{ default: 'inline' }}>
        <MastheadToggle>
          <PageToggleButton
            variant='plain'
            aria-label='Global navigation'
            isNavOpen={navOpen}
            onNavToggle={onNavToggle}
            id='vertical-nav-toggle'
          >
            <BarsIcon />
          </PageToggleButton>
        </MastheadToggle>
        <MastheadMain>
          <HawtioBrand />
        </MastheadMain>
        <MastheadContent>
          <HawtioHeaderToolbar />
        </MastheadContent>
      </Masthead>
    </React.Fragment>
  )
}

const HawtioBrand: React.FunctionComponent = () => {
  const { hawtconfig, hawtconfigLoaded } = useHawtconfig()

  if (!hawtconfigLoaded) {
    return null
  }

  const appLogo = hawtconfig.branding?.appLogoUrl || hawtioLogo
  const appName = hawtconfig.branding?.appName || DEFAULT_APP_NAME

  return (
    <MastheadBrand component={props => <Link to='/' {...props} />}>
      <Brand src={appLogo} alt={appName} />
    </MastheadBrand>
  )
}

const HawtioHeaderToolbar: React.FunctionComponent = () => {
  const { username } = useContext(PageContext)

  const [helpOpen, setHelpOpen] = useState(false)
  const [userOpen, setUserOpen] = useState(false)
  const [aboutOpen, setAboutOpen] = useState(false)

  const onHelpSelect = () => setHelpOpen(!helpOpen)
  const onUserSelect = () => setUserOpen(!userOpen)
  const onAboutToggle = () => setAboutOpen(!aboutOpen)

  const logout = () => userService.logout()

  const helpItems = [
    <DropdownItem key='help' component={<Link to='/help'>Help</Link>} />,
    <DropdownItem key='about' onClick={onAboutToggle}>
      About
    </DropdownItem>,
  ]

  const userItems = [
    <DropdownItem key='preferences' component={<Link to='/preferences'>Preferences</Link>} />,
    <DropdownItem key='logout' onClick={logout}>
      Log out
    </DropdownItem>,
  ]

  return (
    <Toolbar id='hawtio-header-toolbar'>
      <ToolbarContent>
        <ToolbarGroup>
          <ToolbarItem>
            <Dropdown
              isPlain
              position='right'
              onSelect={onHelpSelect}
              toggle={
                <DropdownToggle toggleIndicator={null} onToggle={setHelpOpen}>
                  <HelpIcon />
                </DropdownToggle>
              }
              isOpen={helpOpen}
              dropdownItems={helpItems}
            />
          </ToolbarItem>
        </ToolbarGroup>
        <ToolbarGroup>
          <ToolbarItem>
            <Dropdown
              isPlain
              position='right'
              onSelect={onUserSelect}
              isOpen={userOpen}
              toggle={
                <DropdownToggle
                  id='hawtio-header-user-dropdown-toggle'
                  onToggle={setUserOpen}
                  icon={<Avatar src={userAvatar} alt='user' />}
                >
                  {username}
                </DropdownToggle>
              }
              dropdownItems={userItems}
            />
          </ToolbarItem>
        </ToolbarGroup>
      </ToolbarContent>
      <HawtioAbout isOpen={aboutOpen} onClose={onAboutToggle} />
    </Toolbar>
  )
}
