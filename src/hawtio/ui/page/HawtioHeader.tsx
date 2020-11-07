import { Avatar, Brand, Dropdown, DropdownItem, DropdownToggle, PageHeader, Toolbar, ToolbarGroup, ToolbarItem } from '@patternfly/react-core'
import { HelpIcon } from '@patternfly/react-icons'
import React from 'react'
import imgLogo from '../../../img/hawtio-logo.svg'
import imgAvatar from '../../../img/img_avatar.svg'
import HawtioExtension from '../extension/HawtioExtension'
import HawtioAbout from '../about/HawtioAbout'
import { Link } from 'react-router-dom'

type HawtioHeaderProps = {
}

type HawtioHeaderState = {
  isHelpOpen: boolean
  isUserOpen: boolean
  isAboutOpen: boolean
}

class HawtioHeader extends React.Component<HawtioHeaderProps, HawtioHeaderState> {
  constructor(props: HawtioHeaderProps) {
    super(props)
    this.state = {
      isHelpOpen: false,
      isUserOpen: false,
      isAboutOpen: false
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
    this.setState(({ isAboutOpen }) => ({ isAboutOpen: !isAboutOpen }))

  render() {
    const { isUserOpen, isHelpOpen, isAboutOpen } = this.state

    const helpItems = [
      <DropdownItem key="help" component={
        <Link to='/help'>Help</Link>
      } />,
      <DropdownItem key="about" onClick={this.onAboutToggle}>About</DropdownItem>
    ]

    const userItems = [
      <DropdownItem key="preferences" component={
        <Link to='/preferences'>Preferences</Link>
      } />,
      <DropdownItem key="logout" component={
        <Link to='/logout'>Log out</Link>
      } />
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
      <React.Fragment>
        <PageHeader
          logo={<Brand src={imgLogo} alt="Hawtio Management Console" />}
          logoProps={{ href: '/' }}
          toolbar={PageToolbar}
          avatar={<Avatar src={imgAvatar} alt="user" />}
          showNavToggle
        />
        <HawtioAbout isOpen={isAboutOpen} onClose={this.onAboutToggle} />
      </React.Fragment>
    )
  }
}

export default HawtioHeader
