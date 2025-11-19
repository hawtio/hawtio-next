import imgLogo from '@hawtiosrc/img/hawtio-logo.svg'
import { stringSorter } from '@hawtiosrc/util/strings'
import { AboutModal, Content } from '@patternfly/react-core'
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
  const backgroundImgSrc = about.backgroundImgSrc
  const title = about.title || 'Hawtio Management Console'
  const copyright = about.copyright || '© Hawtio project'

  const AboutDescription = () => {
    if (about.description) {
      return (
        <Content id='hawtio-about-description'>
          <Content component='p'>{about.description}</Content>
        </Content>
      )
    }
    return null
  }

  const productInfo = about.productInfo || []
  productInfo.sort((a, b) => stringSorter(a.name, b.name))
  log.debug('Product info:', productInfo)
  const AboutProductInfo = () => (
    <Content id='hawtio-about-product-info'>
      <Content component='h3'>Component versions</Content>
      <Content component='dl'>
        {productInfo.map((info, index) => (
          <React.Fragment key={`product-info-${index}`}>
            <Content component='dt'>{info.name}</Content>
            <Content component='dd'>{info.value}</Content>
          </React.Fragment>
        ))}
      </Content>
    </Content>
  )

  return (
    <AboutModal
      isOpen={props.isOpen}
      onClose={props.onClose}
      productName={title}
      brandImageSrc={imgSrc}
      backgroundImageSrc={backgroundImgSrc}
      brandImageAlt={title}
      trademark={copyright}
    >
      <AboutDescription />
      <AboutProductInfo />
    </AboutModal>
  )
}
