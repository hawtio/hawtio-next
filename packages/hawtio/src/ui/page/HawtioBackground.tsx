import backgroundImageSrcLg from '@hawtiosrc/img/pfbg_1200.jpg'
import backgroundImageSrcXs from '@hawtiosrc/img/pfbg_576.jpg'
import backgroundImageSrcXs2x from '@hawtiosrc/img/pfbg_576@2x.jpg'
import backgroundImageSrcSm from '@hawtiosrc/img/pfbg_768.jpg'
import backgroundImageSrcSm2x from '@hawtiosrc/img/pfbg_768@2x.jpg'
import { BackgroundImage, BackgroundImageSrcMap } from '@patternfly/react-core'
import React from 'react'

const images: BackgroundImageSrcMap = {
  xs: backgroundImageSrcXs,
  xs2x: backgroundImageSrcXs2x,
  sm: backgroundImageSrcSm,
  sm2x: backgroundImageSrcSm2x,
  lg: backgroundImageSrcLg,
}

export const HawtioBackground: React.FunctionComponent = () => <BackgroundImage src={images} />
