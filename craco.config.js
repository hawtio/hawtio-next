const path = require('path')

module.exports = {
  webpack: {
    alias: {
      '@hawtio': path.resolve(__dirname, 'src/hawtio'),
    },
  },
  jest: {
    configure: {
      moduleNameMapper: {
        '@hawtio/(.*)': '<rootDir>/src/hawtio/$1',
      },
    },
  },
}
