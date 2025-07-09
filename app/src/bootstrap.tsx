// This is our application's bootstrap code which:
// - statically imports react
// - statically imports Hawtio services
// - statically imports <HawtioInitialization> React component (which doesn't use Patternfly)
// - configures Hawtio synchronously (adding plugins and product info)
// - calls asynchronous hawtio.bootstrap() and on fulfilled promise, dynamically (with "import()") imports
//   @hawtio/react/ui and it's <Hawtio> React/Patternfly component
//
// The separation of statically loaded <HawtioInitialization> and dynamically loaded <Hawtio> components allows
// us to provide user feedback as soon as possible

import React from 'react'
import ReactDOM from 'react-dom/client'

import { configManager, hawtio, HawtioInitialization, TaskState } from '@hawtio/react/init'

// Create root for rendering React components. More React components can be rendered in single root.
const root = ReactDOM.createRoot(document.getElementById('root') as HTMLElement)

// Basic UI that shows initialization progress without depending on Patternfly.
// It is imported and rendered in fully synchronous way.
root.render(<HawtioInitialization verbose={false} />)

// Hawtio itself creates and tracks initialization tasks, but we can add our own.
configManager.initItem('Loading UI', TaskState.started, 'config')

// Configure the console
configManager.addProductInfo('Test App', '1.0.0')

// Add relative URL from which plugin definitions will be loaded. Relative URIs are resolved against document.baseURI.
hawtio.addUrl('plugin')

import('@hawtio/react').then(async m => {
  // Register all default Hawtio plugins
  m.registerPlugins()

  // You can also select which builtin plugins to load
  //connect()
  //jmx()
  //camel()

  import('./examples').then(m => {
    m.registerExamples()
  })

  // hawtio.bootstrap() will wait for all init items to be ready, so we have to finish "loading"
  // stage of UI. UI will be rendered after bootstrap()
  configManager.initItem('Loading UI', TaskState.finished, 'config')

  m.hawtio.bootstrap().then(() => {
    import('@hawtio/react/ui').then(m => {
      root.render(
        <React.StrictMode>
          <m.Hawtio />
        </React.StrictMode>,
      )
    })
  })
})
