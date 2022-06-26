import imgLogo from '@hawtio/img/hawtio-logo.svg'
import imgAvatar from '@hawtio/img/img_avatar.svg'
import HawtioAbout from '@hawtio/ui/about/HawtioAbout'
import { Avatar, Brand, Dropdown, DropdownItem, DropdownToggle, PageHeader, PageHeaderTools, PageHeaderToolsGroup, PageHeaderToolsItem } from '@patternfly/react-core'
import { HelpIcon } from '@patternfly/react-icons'
import React from 'react'
import { Link } from 'react-router-dom'
import './HawtioHeader.css'

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
    this.setState({ isHelpOpen });

  private onHelpSelect = (_event?: React.SyntheticEvent<HTMLDivElement>) =>
    this.setState({ isHelpOpen: !this.state.isHelpOpen });

  private onUserToggle = (isUserOpen: boolean) =>
    this.setState({ isUserOpen });

  private onUserSelect = (_event?: React.SyntheticEvent<HTMLDivElement>) =>
    this.setState({ isUserOpen: !this.state.isUserOpen });

  private onAboutToggle = () =>
    this.setState(({ isAboutOpen }) => ({ isAboutOpen: !isAboutOpen }));

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

    const HeaderTools = (
      <PageHeaderTools>
        <PageHeaderToolsGroup>
          <PageHeaderToolsItem>
            <Dropdown
              isPlain
              position="right"
              onSelect={this.onHelpSelect}
              toggle={
                <DropdownToggle toggleIndicator={null} onToggle={this.onHelpToggle}>
                  <HelpIcon />
                </DropdownToggle>
              }
              isOpen={isHelpOpen}
              dropdownItems={helpItems}
            />
          </PageHeaderToolsItem>
        </PageHeaderToolsGroup>
        <PageHeaderToolsGroup>
          <PageHeaderToolsItem>
            <Dropdown
              isPlain
              position="right"
              onSelect={this.onUserSelect}
              isOpen={isUserOpen}
              toggle={
                <DropdownToggle
                  id="hawtio-header-user-dropdown-toggle"
                  onToggle={this.onUserToggle}
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
        <HawtioAbout isOpen={isAboutOpen} onClose={this.onAboutToggle} />
      </React.Fragment>
    )
  }
}

export default HawtioHeader
