import { Avatar, Brand, Dropdown, DropdownItem, DropdownToggle, Nav, NavItem, NavList, Page, PageHeader, PageSection, PageSidebar, Text, TextContent, Toolbar, ToolbarGroup, ToolbarItem, PageSectionVariants } from '@patternfly/react-core'
import { HelpIcon } from '@patternfly/react-icons'
import React from 'react'
import imgLogo from '../../../img/hawtio-logo.svg'
import imgAvatar from '../../../img/img_avatar.svg'
import HawtioAbout from '../about/HawtioAbout'
import HawtioExtension from '../extension/HawtioExtension'
import HawtioBackground from './HawtioBackground'

type HawtioPageProps = {
}

type HawtioPageState = {
  isHelpOpen: boolean
  isUserOpen: boolean
  isAboutOpen: boolean
  activeItem: number
}

class HawtioPage extends React.Component<HawtioPageProps, HawtioPageState> {
  constructor(props: HawtioPageProps) {
    super(props)
    this.state = {
      isHelpOpen: false,
      isUserOpen: false,
      isAboutOpen: false,
      activeItem: 0
    }
  }

  private onHelpToggle = (isHelpOpen: boolean) =>
    this.setState({ isHelpOpen })

  private onHelpSelect = (_event?: React.SyntheticEvent<HTMLDivElement>) =>
    this.setState({ isHelpOpen: !this.state.isHelpOpen })

  private onUserToggle = (isUserOpen: boolean) =>
    this.setState({ isUserOpen })

  private onUserSelect = (_event?: React.SyntheticEvent<HTMLDivElement>) =>
    this.setState({ isUserOpen: !this.state.isUserOpen })

  private onAboutToggle = () =>
    this.setState(({ isAboutOpen }) => ({
      isAboutOpen: !isAboutOpen
    }))

  private header() {
    const { isUserOpen, isHelpOpen } = this.state

    const helpItems = [
      <DropdownItem key="help">Help</DropdownItem>,
      <DropdownItem key="about" onClick={this.onAboutToggle}>About</DropdownItem>
    ]
    const userItems = [
      <DropdownItem key="preferences">Preferences</DropdownItem>,
      <DropdownItem key="logout">Log out</DropdownItem>
    ]
    const PageToolbar = (
      <Toolbar>
        <ToolbarGroup>
          <ToolbarItem>
            <HawtioExtension name="header-tools" />
          </ToolbarItem>
          <ToolbarItem>
            <Dropdown
              isPlain
              position="right"
              onSelect={this.onHelpSelect}
              toggle={
                <DropdownToggle onToggle={this.onHelpToggle} iconComponent={HelpIcon} />
              }
              isOpen={isHelpOpen}
              dropdownItems={helpItems}
            />
          </ToolbarItem>
        </ToolbarGroup>
        <ToolbarGroup>
          <ToolbarItem>
            <Dropdown
              isPlain
              position="right"
              onSelect={this.onUserSelect}
              isOpen={isUserOpen}
              toggle={
                <DropdownToggle onToggle={this.onUserToggle}>
                  Hawtio User
                </DropdownToggle>
              }
              dropdownItems={userItems}
            />
          </ToolbarItem>
        </ToolbarGroup>
      </Toolbar>
    )
    return (
      <PageHeader
        logo={<Brand src={imgLogo} alt="Hawtio Management Console" />}
        logoProps={{ href: '/' }}
        toolbar={PageToolbar}
        avatar={<Avatar src={imgAvatar} alt="user" />}
        showNavToggle
      />
    )
  }

  private onNavSelect = (result: { itemId: number | string }) => {
    if (typeof result.itemId === 'number') {
      this.setState({
        activeItem: result.itemId
      })
    }
  }

  private sidebar() {
    const { activeItem } = this.state

    const PageNav = (
      <Nav onSelect={this.onNavSelect} theme="dark">
        <NavList>
          <NavItem itemId={0} isActive={activeItem === 0}>
            Section 1
          </NavItem>
          <NavItem itemId={1} isActive={activeItem === 1}>
            Section 2
          </NavItem>
          <NavItem itemId={2} isActive={activeItem === 2}>
            Section 3
          </NavItem>
        </NavList>
      </Nav>
    )
    return (
      <PageSidebar
        nav={PageNav}
        theme="dark" />
    )
  }

  private pageMain() {
    return (
      <PageSection variant={PageSectionVariants.light}>
        <TextContent>
          <Text component="h1">Section</Text>
          <Text component="p">Hello world!</Text>
        </TextContent>
      </PageSection>)
  }

  render() {
    const { isAboutOpen } = this.state
    return (
      <React.Fragment>
        <HawtioBackground />
        <Page
          header={this.header()}
          sidebar={this.sidebar()}
          isManagedSidebar
        >
          {this.pageMain()}
        </Page>
        <HawtioAbout isOpen={isAboutOpen} onClose={this.onAboutToggle} />
      </React.Fragment>
    )
  }
}

export default HawtioPage
