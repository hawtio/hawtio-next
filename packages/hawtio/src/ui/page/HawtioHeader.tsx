import imgLogo from '@hawtiosrc/img/hawtio-logo.svg'
import imgAvatar from '@hawtiosrc/img/img_avatar.svg'
import { HawtioAbout } from '@hawtiosrc/ui/about/HawtioAbout'
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
import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import { useBranding } from './context'
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
  const { branding, brandingLoaded } = useBranding()

  if (!brandingLoaded) {
    return null
  }

  const appLogo = branding.appLogoUrl || imgLogo
  const appName = branding.appName || 'Hawtio Management Console'

  return (
    <MastheadBrand component={props => <Link to='/' {...props} />}>
      <Brand src={appLogo} alt={appName} />
    </MastheadBrand>
  )
}

const HawtioHeaderToolbar: React.FunctionComponent = () => {
  const [helpOpen, setHelpOpen] = useState(false)
  const [userOpen, setUserOpen] = useState(false)
  const [aboutOpen, setAboutOpen] = useState(false)

  const onHelpSelect = () => setHelpOpen(!helpOpen)
  const onUserSelect = () => setUserOpen(!userOpen)
  const onAboutToggle = () => setAboutOpen(!aboutOpen)

  const helpItems = [
    <DropdownItem key='help' component={<Link to='/help'>Help</Link>} />,
    <DropdownItem key='about' onClick={onAboutToggle}>
      About
    </DropdownItem>,
  ]

  const userItems = [
    <DropdownItem key='preferences' component={<Link to='/preferences'>Preferences</Link>} />,
    <DropdownItem key='logout' component={<Link to='/logout'>Log out</Link>} />,
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
                  icon={<Avatar src={imgAvatar} alt='user' />}
                >
                  Hawtio User
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
