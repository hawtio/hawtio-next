import { BackgroundImage, BackgroundImageSrcMap } from '@patternfly/react-core'
import React from 'react'
import backgroundImageSrcLg from '../../../img/pfbg_1200.jpg'
import backgroundImageSrcXs from '../../../img/pfbg_576.jpg'
import backgroundImageSrcXs2x from '../../../img/pfbg_576@2x.jpg'
import backgroundImageSrcSm from '../../../img/pfbg_768.jpg'
import backgroundImageSrcSm2x from '../../../img/pfbg_768@2x.jpg'

type HawtioBackgroundProps = {
}

const images: BackgroundImageSrcMap = {
  xs: backgroundImageSrcXs,
  xs2x: backgroundImageSrcXs2x,
  sm: backgroundImageSrcSm,
  sm2x: backgroundImageSrcSm2x,
  lg: backgroundImageSrcLg
}

const HawtioBackground: React.FunctionComponent<HawtioBackgroundProps> = props =>
  <BackgroundImage src={images} />

export default HawtioBackground
