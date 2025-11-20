import { Bullseye, Content, Page, Spinner } from '@patternfly/react-core'
import React from 'react'

export const HawtioLoadingPage: React.FunctionComponent = () => (
  <Page>
    <Bullseye>
      <div style={{ justifyContent: 'center' }}>
        <Spinner diameter='60px' aria-label='Loading Hawtio' />

        <Content>
          <Content className={'--pf-t--global--background--color--200'} component='h3'>
            Loading ...
          </Content>
        </Content>
      </div>
    </Bullseye>
  </Page>
)
