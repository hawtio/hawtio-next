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

import { configManager, hawtio, HawtioInitialization, TaskState } from '@hawtio/react/init'

const root = ReactDOM.createRoot(document.getElementById('root') as HTMLElement)

// basic UI showing initialization progress without dependencies on Patternfly
root.render(<HawtioInitialization />)

configManager.initItem("Loading UI", TaskState.started, "config")

// TODO: decide where to allow custom configuration
configManager.authRetry = false

// Configure the console
configManager.addProductInfo('Test App', '1.0.0')

hawtio.addUrl('plugin')

import("@hawtio/react").then(async m => {

  // Register all default Hawtio plugins
  m.registerPlugins()

  // You can also select which builtin plugins to load
  //connect()
  //jmx()
  //camel()

  import("./examples").then(m => {
    m.registerExamples()
  })

  // hawtio.bootstrap() will wait for all init items to be ready, so we have to finish "loading"
  // stage of UI. UI will be rendered after bootstrap()
  configManager.initItem("Loading UI", TaskState.finished, "config")

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
