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
yarn add @hawtio/react@1.9.x-react17_memoryrouter.dev.#
```

## Usage

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

## License

Hawtio React is licensed under the [Apache 2.0 License](./LICENSE).
