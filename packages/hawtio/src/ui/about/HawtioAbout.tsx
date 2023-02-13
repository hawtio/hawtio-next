import imgLogo from '@hawtiosrc/img/hawtio-logo.svg'
import { stringSorter } from '@hawtiosrc/util/strings'
import { AboutModal, Text, TextContent, TextList, TextListItem } from '@patternfly/react-core'
import React from 'react'
import { useAbout } from './context'
import { log } from './globals'
import './HawtioAbout.css'

type HawtioAboutProps = {
  isOpen: boolean
  onClose: () => void
}

export const HawtioAbout: React.FunctionComponent<HawtioAboutProps> = props => {
  const { about, aboutLoaded } = useAbout()

  if (!aboutLoaded) {
    return null
  }

  const imgSrc = about.imgSrc || imgLogo
  const title = about.title || 'Hawtio Management Console'
  const copyright = about.copyright || '© Hawtio project'

  const AboutDescription = () => {
    if (about.description) {
      return (
        <TextContent id='hawtio-about-description'>
          <Text component='p'>{about.description}</Text>
        </TextContent>
      )
    }
    return null
  }

  const productInfo = about.productInfo || []
  productInfo.sort((a, b) => stringSorter(a.name, b.name))
  log.debug('Product info:', productInfo)

  const AboutProductInfo = () => (
    <TextContent id='hawtio-about-product-info'>
      <Text component='h3'>Component versions</Text>
      <TextList component='dl'>
        {productInfo.map((info, index) => (
          <React.Fragment key={`product-info-${index}`}>
            <TextListItem component='dt'>{info.name}</TextListItem>
            <TextListItem component='dd'>{info.value}</TextListItem>
          </React.Fragment>
        ))}
      </TextList>
    </TextContent>
  )

  return (
    <AboutModal
      isOpen={props.isOpen}
      onClose={props.onClose}
      productName={title}
      brandImageSrc={imgSrc}
      brandImageAlt={title}
      trademark={copyright}
    >
      <AboutDescription />
      <AboutProductInfo />
    </AboutModal>
  )
}
