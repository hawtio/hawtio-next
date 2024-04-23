# Hawtio Backend Middleware for Express

[![Test](https://github.com/hawtio/hawtio-backend-middleware/actions/workflows/test.yml/badge.svg)](https://github.com/hawtio/hawtio-backend-middleware/actions/workflows/test.yml)

An Express middleware that implements Hawtio backend.

## Installation

### NPM

```console
npm install --save-dev @hawtio/backend-middleware
```

### Yarn

```console
yarn add --dev @hawtio/backend-middleware
```

## Usage

You can use this backend with Express as follows:

```javascript
const express = require('express')
const { hawtioBackend } = require('@hawtio/backend-middleware')

const app = express()
app.get('/', (req, res) => {
  res.send('hello!')
})
app.use(
  '/proxy',
  hawtioBackend({
    // Uncomment it if you want to see debug log for Hawtio backend
    logLevel: 'debug',
  }),
)
app.listen(3333, () => {
  console.log('started')
})
```

To use it with Webpack, set up dev server's middlewares as follows:

```javascript
const { hawtioBackend } = require('@hawtio/backend-middleware')

module.exports = {
  devServer: {
    setupMiddlewares: middlewares => {
      middlewares.unshift({
        name: 'hawtio-backend',
        path: '/proxy',
        middleware: hawtioBackend({
          // Uncomment it if you want to see debug log for Hawtio backend
          logLevel: 'debug',
        }),
      })

      return middlewares
    },
  },
}
```
