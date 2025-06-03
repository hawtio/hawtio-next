// This is our application's bootstrap code which:
// - statically imports react
// - statically imports Hawtio services
// - statically imports <HawtioInitialization> React component (which doesn't use Patternfly)
// - configures Hawtio synchronously (adding plugins and product info)
// - calls asynchronous hawtio.bootstrap() and on fulfulled promise, dynamically (with "import()") imports
//   @hawtio/react/ui and it's <Hawtio> React/Patternfly component
//
// The separation of statically loaded <HawtioInitialization> and dynamically loaded <Hawtio> components allows
// us to provide user feedback as soon as possible

import React from 'react'
import ReactDOM from 'react-dom/client'

import { HawtioInitialization } from '@hawtio/react/init'

const root = ReactDOM.createRoot(document.getElementById('root') as HTMLElement)

// basic UI showing initialization progress without dependencies on Patternfly
root.render(<HawtioInitialization />)

import("@hawtio/react").then(m => {
  // Configure the console
  m.configManager.addProductInfo('Test App', '1.0.0')
  m.hawtio.addUrl('plugin')

  // Register all default Hawtio plugins
  m.registerPlugins()

  // You can also select which builtin plugins to load
  //connect()
  //jmx()
  //camel()

  import("./examples").then(m => {
    m.registerExamples()
  })

  m.hawtio.bootstrap().then(() => {
    import("@hawtio/react/ui").then(m => {
      root.render(
        <React.StrictMode>
          <m.Hawtio />
        </React.StrictMode>,
      )
    })
  })
})
