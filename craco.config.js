const path = require('path')

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
}
