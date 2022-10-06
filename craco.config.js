const path = require('path')
const { hawtioBackend } = require('@hawtio/backend-middleware')

module.exports = {
  webpack: {
    alias: {
      '@hawtio': path.resolve(__dirname, 'src/hawtio'),
    },
  },
  jest: {
    configure: config => {
      config.moduleNameMapper['@hawtio/(.*)'] = '<rootDir>/src/hawtio/$1'
      config.transformIgnorePatterns = [
        "node_modules/(?!@patternfly/react-icons/dist/esm/icons)/"
      ]
      return config
    }
  },
  devServer: {
    setupMiddlewares: (middlewares) => {
      middlewares.push({
        name: 'hawtio-backend',
        path: '/proxy',
        middleware: hawtioBackend({
          // Uncomment it if you want to see debug log for Hawtio backend
          logLevel: 'debug',
        })
      })

      return middlewares
    }
  }
}
