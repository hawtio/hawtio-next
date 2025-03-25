# Hawtio React for embedding in React single-page applications

# Usage

This version is specifically tailored to allow for insertion of the console
into other React SPAs. The most notable change is the replacement of the React
[BrowserRouter](https://v5.reactrouter.com/web/api/BrowserRouter) with the
[MemoryRouter](https://v5.reactrouter.com/core/api/MemoryRouter) thereby ensuring
that the address bar is not updated when a new page is required in the hawtio console.

Due to the console being targetted for embedding in some applications, eg. OCP, the console has been backported to [React 17](https://17.reactjs.org/).

## Source Branch

https://github.com/hawtio/hawtio-next/tree/react17-memoryrouter

## Install

- x: version of @hawtio/react to install
- #: micro build of the version

NPM

```console
npm i @hawtio/react@1.9.x-react17.memoryrouter.dev.#
```

Yarn

```console
yarn add @hawtio/react@1.9.x-React17_MemoryRouter.#
```

## Simple, synchronous usage

To run Hawtio application, just follow the React application structure

```javascript
// Required styles
import '@hawtio/react/dist/index.css'
import '@patternfly/react-core/dist/styles/base.css'

import { hawtio, Hawtio, registerPlugins } from '@hawtio/react'
import React from 'react'
import ReactDOM from 'react-dom/client'

// Bootstrap Hawtio
registerPlugins()
hawtio.bootstrap()

const root = ReactDOM.createRoot(
  document.getElementById('root') as HTMLElement
)
root.render(
  <React.StrictMode>
    <Hawtio />
  </React.StrictMode>
)
```

## Asynchronous usage

Hawtio application can be structured to load UI code in asynchronous way. Hawtio can be used with different
JavaScript bundlers (like [Webpack](https://webpack.js.org/)) and supports technologies like [Module Federation](https://webpack.js.org/concepts/module-federation/).

Here's an example of initialization code that is Module Federation friendly and allows better code splitting at bundling time:

**index.ts** - an entry point

```javascript
import '@hawtio/react/dist/index.css'
import '@patternfly/react-core/dist/styles/base.css'

import('./bootstrap')
```

**bootstrap.tsx** - asynchronously loaded UI initialization code

```javascript
import { configManager, hawtio, HawtioInitialization } from '@hawtio/react/init'

import React from 'react'
import ReactDOM from 'react-dom/client'

// Single React root for rendering initialization and main UI
const root = ReactDOM.createRoot(
  document.getElementById('root') as HTMLElement
)

// Initialization UI showing loading progress
root.render(<HawtioInitialization verbose={true} />)

// Dynamic, asynchronous import of Hawtio core modules
import('@hawtio/react').then(async m => {
  // Hawtio built-in plugins
  m.registerPlugins()

  // Bootstrap Hawtio
  m.hawtio.bootstrap().then(() => {
    // Dynamic, asynchronous import of Hawtio UI modules
    import('@hawtio/react/ui').then(m => {
      // Main Hawtio UI - replacing initialization UI at this point
      root.render(
        <React.StrictMode>
          <m.Hawtio />
        </React.StrictMode>,
      )
    })
  })
})
```

## License

Hawtio React is licensed under the [Apache 2.0 License](./LICENSE).
