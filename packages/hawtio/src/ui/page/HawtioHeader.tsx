import { PUBLIC_USER, userService } from '@hawtiosrc/auth'
import { DEFAULT_APP_NAME, useHawtconfig, UniversalHeaderItem, isUniversalHeaderItem } from '@hawtiosrc/core'
import { hawtioLogo, userAvatar } from '@hawtiosrc/img'
import { preferencesService } from '@hawtiosrc/preferences/preferences-service'
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
  Title,
  Toolbar,
  ToolbarContent,
  ToolbarGroup,
  ToolbarItem,
} from '@patternfly/react-core'
import { BarsIcon, HelpIcon } from '@patternfly/react-icons'
import React, { useContext, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import './HawtioHeader.css'
import { PageContext } from './context'

export const HawtioHeader: React.FunctionComponent = () => {
  const [navOpen, setNavOpen] = useState(preferencesService.isShowVerticalNavByDefault())

  const onNavToggle = () => setNavOpen(!navOpen)

  return (
    <Masthead id='hawtio-header' display={{ default: 'inline' }}>
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
  )
}

const HawtioBrand: React.FunctionComponent = () => {
  const { hawtconfig, hawtconfigLoaded } = useHawtconfig()

  if (!hawtconfigLoaded) {
    return null
  }

  const appLogo = hawtconfig.branding?.appLogoUrl ?? hawtioLogo
  const appName = hawtconfig.branding?.appName ?? DEFAULT_APP_NAME
  const showAppName = hawtconfig.branding?.showAppName ?? false

  return (
    <MastheadBrand id='hawtio-header-brand' component={props => <Link to='/' {...props} />}>
      <Brand src={appLogo} alt={appName} />
      {showAppName && (
        <Title headingLevel='h1' size='xl'>
          {appName}
        </Title>
      )}
    </MastheadBrand>
  )
}

const HawtioHeaderToolbar: React.FunctionComponent = () => {
  const { username, plugins } = useContext(PageContext)
  const location = useLocation()

  const isPublic = username === PUBLIC_USER

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
  if (isPublic) {
    // Delete logout
    userItems.pop()
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const collectHeaderItems = (): React.ComponentType<any>[] => {
    const path = location.pathname

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const components: React.ComponentType<any>[] = []

    // Iterate through the plugins ...
    plugins.forEach(plugin => {
      if (!plugin.headerItems || plugin.headerItems.length === 0) return // no header items in plugin

      // if plugin is currently visible in UI
      if (plugin.path && path.startsWith(plugin.path)) {
        components.push(
          ...plugin.headerItems.map(headerItem =>
            isUniversalHeaderItem(headerItem) ? headerItem.component : headerItem,
          ),
        )
        return
      }

      components.push(
        ...plugin.headerItems
          .filter(
            headerItem => isUniversalHeaderItem(headerItem) && (headerItem as UniversalHeaderItem).universal === true,
          )
          .map(headerItem => (headerItem as UniversalHeaderItem).component),
      )
    })

    return components
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const headerComponents: React.ComponentType<any>[] = collectHeaderItems()

  return (
    <Toolbar id='hawtio-header-toolbar'>
      <ToolbarContent>
        <ToolbarGroup>
          {headerComponents.map((component, index) => (
            <ToolbarItem key={`hawtio-header-toolbar-plugin-item-${index}`}>
              {React.createElement(component)}
            </ToolbarItem>
          ))}
        </ToolbarGroup>
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
                  {isPublic ? '' : username}
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
