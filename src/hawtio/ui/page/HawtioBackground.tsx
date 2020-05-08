import { BackgroundImage, BackgroundImageSrc } from '@patternfly/react-core'
import React from 'react'
import backgroundImageSrcLg from '../../../img/pfbg_1200.jpg'
import backgroundImageSrcXs from '../../../img/pfbg_576.jpg'
import backgroundImageSrcXs2x from '../../../img/pfbg_576@2x.jpg'
import backgroundImageSrcSm from '../../../img/pfbg_768.jpg'
import backgroundImageSrcSm2x from '../../../img/pfbg_768@2x.jpg'

type HawtioBackgroundProps = {
}

const images = {
  [BackgroundImageSrc.xs]: backgroundImageSrcXs,
  [BackgroundImageSrc.xs2x]: backgroundImageSrcXs2x,
  [BackgroundImageSrc.sm]: backgroundImageSrcSm,
  [BackgroundImageSrc.sm2x]: backgroundImageSrcSm2x,
  [BackgroundImageSrc.lg]: backgroundImageSrcLg
}

const HawtioBackground: React.SFC<HawtioBackgroundProps> = props =>
  <BackgroundImage src={images} />

export default HawtioBackground
