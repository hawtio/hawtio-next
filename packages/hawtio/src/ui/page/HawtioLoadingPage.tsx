import { Bullseye, Page, Spinner, Content, ContentVariants } from '@patternfly/react-core'
import React from 'react'

export const HawtioLoadingPage: React.FunctionComponent = () => (
  <Page>
    <Bullseye>
      <div style={{ justifyContent: 'center' }}>
        <Spinner diameter='60px' aria-label='Loading Hawtio' />

        <Content>
          <Content
            className={'--pf-t--temp--dev--tbd' /* CODEMODS: original v5 color was --pf-v5-global--Color--200 */}
            component={ContentVariants.h3}
          >
            Loading ...
          </Content>
        </Content>
      </div>
    </Bullseye>
  </Page>
)
