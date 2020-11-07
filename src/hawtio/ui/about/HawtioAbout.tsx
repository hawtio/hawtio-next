import { AboutModal, TextContent, TextList, TextListItem } from '@patternfly/react-core'
import React from 'react'
import imgLogo from '../../../img/hawtio-logo.svg'

type HawtioAboutProps = {
  isOpen: boolean
  onClose: () => void
}

const HawtioAbout: React.FunctionComponent<HawtioAboutProps> = props => {
  return (
    <AboutModal
      isOpen={props.isOpen}
      onClose={props.onClose}
      trademark="&copy; Hawtio project"
      brandImageSrc={imgLogo}
      brandImageAlt="Hawtio Management Console"
      productName="Hawtio Management Console"
    >
      <TextContent>
        <TextList component="dl">
          <TextListItem component="dt">Hawtio.next</TextListItem>
          <TextListItem component="dd">PACKAGE_VERSION_PLACEHOLDER</TextListItem>
          <TextListItem component="dt">ABC</TextListItem>
          <TextListItem component="dd">a.b.c</TextListItem>
          <TextListItem component="dt">XYZ</TextListItem>
          <TextListItem component="dd">x.y.z</TextListItem>
        </TextList>
      </TextContent>
    </AboutModal>)
}

export default HawtioAbout
