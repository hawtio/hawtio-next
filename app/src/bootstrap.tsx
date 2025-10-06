// This is our application's bootstrap code which:
// - statically imports react
// - statically imports Hawtio services
// - statically imports <HawtioInitialization> React component (which doesn't use PatternFly)
// - configures Hawtio synchronously (adding plugins and product info)
// - calls asynchronous hawtio.bootstrap() and on fulfilled promise, dynamically (with 'import()') imports
//   @hawtio/react/ui and it's <Hawtio> React/PatternFly component
//
// The separation of statically loaded <HawtioInitialization> and dynamically loaded <Hawtio> components allows
// us to provide user feedback as soon as possible

import React from 'react'
import ReactDOM from 'react-dom/client'

import { configManager, hawtio, HawtioInitialization, TaskState, Logger } from '@hawtio/react/init'

// Hawtio itself creates and tracks initialization tasks, but we can add our own.
configManager.initItem('Loading UI', TaskState.started, 'config')

// Create root for rendering React components. More React components can be rendered in single root.
const root = ReactDOM.createRoot(document.getElementById('root') as HTMLElement)

// Basic UI that shows initialization progress without depending on PatternFly.
// It is imported and rendered in fully synchronous way.
root.render(<HawtioInitialization verbose={configManager.globalLogLevel() < Logger.INFO.value} />)

// Configure the console
configManager.addProductInfo('Test App', '1.0.0')

// Add relative URL from which plugin definitions will be loaded. Plugins will be loaded and evaluated
// using @module-federation/utilities
// Relative URIs are resolved against document.baseURI.
hawtio.addUrl('plugin')

// Initialization phase is finished. We could already bootstrap Hawtio, but this is the stage, where we register
// built-in Hawtio plugins and our examples (custom plugins).
// From now on, we use dynamic `import()` instead of static `import` and we can import _full_ Hawtio packages:
// '@hawtio/react' and '@hawtio/react/ui'
import('@hawtio/react').then(async m => {
  // The heavier non-UI part of Hawtio was loaded/evaluated, so we have access to built-in plugins
  // We can register all default (built-in) Hawtio plugins
  m.registerPlugins()

  // You can alternatively choose which built-in plugins to load
  // m.connect()
  // m.jmx()
  // m.camel()

  // we're awaiting for the import('./examples').
  // registerExamples() and methods called by it (like registerExample1()) are fully synchronous, but
  // may call hawtio.addDeferredPlugin()
  await import('./examples').then(m => {
    m.registerExamples()
  })

  // hawtio.bootstrap() will wait for all init items to be ready, so we have to finish 'loading'
  // stage of UI. UI will be rendered after bootstrap() returned promise is resolved
  configManager.initItem('Loading UI', TaskState.finished, 'config')

  // finally, after we've registered all custom and built-in plugins, we can proceed to the final stage:
  //  - bootstrap(), which finishes internal configuration, applies branding and loads all registered plugins11111
  //  - rendering of <Hawtio> React component after bootstrap() finishes
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
