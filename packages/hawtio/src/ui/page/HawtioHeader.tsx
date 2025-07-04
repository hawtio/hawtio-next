import { PUBLIC_USER, userService } from '@hawtiosrc/auth'
import {
  DEFAULT_APP_NAME,
  useHawtconfig,
  UniversalHeaderItem,
  isUniversalHeaderItem,
  Hawtconfig,
} from '@hawtiosrc/core'
import { hawtioLogo, userAvatar } from '@hawtiosrc/img'
import { preferencesService } from '@hawtiosrc/preferences/preferences-service'
import { HawtioAbout } from '@hawtiosrc/ui/about'
import {
  Avatar,
  Brand,
  Dropdown,
  DropdownItem,
  DropdownList,
  Masthead,
  MastheadBrand,
  MastheadContent,
  MastheadMain,
  MastheadToggle,
  MenuToggle,
  MenuToggleElement,
  PageToggleButton,
  Title,
  Toolbar,
  ToolbarContent,
  ToolbarGroup,
  ToolbarItem,
} from '@patternfly/react-core'

import { BarsIcon, HelpIcon } from '@patternfly/react-icons'
import React, { useContext, useState } from 'react'
import { Link, useLocation } from 'react-router-dom-v5-compat'
import './HawtioHeader.css'
import { PageContext } from './context'

export const HawtioHeader: React.FunctionComponent = () => {
  const { hawtconfig, hawtconfigLoaded } = useHawtconfig()
  const [navOpen, setNavOpen] = useState(preferencesService.isShowVerticalNavByDefault())

  if (!hawtconfigLoaded) {
    return null
  }

  const onNavToggle = () => setNavOpen(!navOpen)

  // If not defined then assume the default of shown
  const sideBarShown = hawtconfig.appearance?.showSideBar ?? true
  const isBrandShown = hawtconfig.appearance?.showBrand ?? true

  return (
    <Masthead id='hawtio-header' display={{ default: 'inline' }}>
      {sideBarShown && (
        <MastheadToggle>
          <PageToggleButton
            variant='plain'
            aria-label='Global navigation'
            isSidebarOpen={navOpen}
            onSidebarToggle={onNavToggle}
            id='vertical-nav-toggle'
          >
            <BarsIcon />
          </PageToggleButton>
        </MastheadToggle>
      )}
      {isBrandShown && (
        <MastheadMain>
          <HawtioBrand hawtconfig={hawtconfig} />
        </MastheadMain>
      )}
      <MastheadContent>
        <HawtioHeaderToolbar hawtconfig={hawtconfig} />
      </MastheadContent>
    </Masthead>
  )
}

type HawtioBrandProps = {
  hawtconfig: Hawtconfig
}

const HawtioBrand: React.FunctionComponent<HawtioBrandProps> = props => {
  const appLogo = props.hawtconfig.branding?.appLogoUrl ?? hawtioLogo
  const appName = props.hawtconfig.branding?.appName ?? DEFAULT_APP_NAME
  const showAppName = props.hawtconfig.branding?.showAppName ?? false

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

type HawtioHeaderToolbarProps = {
  hawtconfig: Hawtconfig
}

const HawtioHeaderToolbar: React.FunctionComponent<HawtioHeaderToolbarProps> = props => {
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

  // If not defined then assume the default of shown
  const userHeaderShown = props.hawtconfig.appearance?.showUserHeader ?? true

  const helpItems = [
    <DropdownItem key='help'>
      <Link to='../help'>Help</Link>{' '}
    </DropdownItem>,
    <DropdownItem key='about' onClick={onAboutToggle}>
      About
    </DropdownItem>,
  ]

  const userItems = [
    <DropdownItem key='preferences'>
      <Link to='../preferences'>Preferences</Link>
    </DropdownItem>,
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
    <Toolbar id='hawtio-header-toolbar' isFullHeight>
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
              onSelect={onHelpSelect}
              onOpenChange={setHelpOpen}
              toggle={(toggleRef: React.Ref<MenuToggleElement>) => (
                <MenuToggle
                  variant='plain'
                  ref={toggleRef}
                  onClick={() => setHelpOpen(!helpOpen)}
                  isExpanded={helpOpen}
                >
                  <HelpIcon />
                </MenuToggle>
              )}
              isOpen={helpOpen}
            >
              {helpItems}
            </Dropdown>
          </ToolbarItem>
        </ToolbarGroup>
        {userHeaderShown && (
          <ToolbarGroup>
            <ToolbarItem>
              <Dropdown
                onSelect={onUserSelect}
                isOpen={userOpen}
                onOpenChange={setUserOpen}
                toggle={(toggleRef: React.Ref<MenuToggleElement>) => (
                  <MenuToggle
                    ref={toggleRef}
                    id='hawtio-header-user-dropdown-toggle'
                    onClick={() => setUserOpen(!userOpen)}
                    icon={<Avatar src={userAvatar} alt='user' />}
                    isExpanded={userOpen}
                    isFullHeight
                  >
                    {isPublic ? '' : username}
                  </MenuToggle>
                )}
              >
                <DropdownList>{userItems}</DropdownList>
              </Dropdown>
            </ToolbarItem>
          </ToolbarGroup>
        )}
      </ToolbarContent>
      <HawtioAbout isOpen={aboutOpen} onClose={onAboutToggle} />
    </Toolbar>
  )
}
