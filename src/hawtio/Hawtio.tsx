import React from 'react'
import { connect } from 'react-redux'
import './Hawtio.css'
import HawtioPage from './ui/page/HawtioPage'

type HawtioProps = {
}

const Hawtio: React.FunctionComponent<HawtioProps> = props =>
  <HawtioPage />

export default connect()(Hawtio)
