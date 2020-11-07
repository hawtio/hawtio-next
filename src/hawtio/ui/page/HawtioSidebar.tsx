import { Nav, NavItem, NavList, PageSidebar } from '@patternfly/react-core'
import React from 'react'
import { Link } from 'react-router-dom'

type HawtioSidebarProps = {
}

type HawtioSidebarState = {
  activeItem: number
}

class HawtioSidebar extends React.Component<HawtioSidebarProps, HawtioSidebarState> {
  constructor(props: HawtioSidebarProps) {
    super(props)
    this.state = {
      activeItem: 0
    }
  }

  private onNavSelect = (result: { itemId: number | string }) => {
    if (typeof result.itemId === 'number') {
      this.setState({
        activeItem: result.itemId
      })
    }
  }

  render() {
    const { activeItem } = this.state

    const PageNav = (
      <Nav onSelect={this.onNavSelect} theme="dark">
        <NavList>
          <NavItem itemId={0} isActive={activeItem === 0}>
            <Link to='/example1'>Example 1</Link>
          </NavItem>
          <NavItem itemId={1} isActive={activeItem === 1}>
            <Link to='/example2'>Example 2</Link>
          </NavItem>
          <NavItem itemId={2} isActive={activeItem === 2}>
            <Link to='/example3'>Example 3</Link>
          </NavItem>
        </NavList>
      </Nav>
    )
    return (
      <PageSidebar nav={PageNav} theme="dark" />
    )
  }
}

export default HawtioSidebar
