const path = require('path')

module.exports = {
  webpack: {
    alias: {
      '@hawtio': path.resolve(__dirname, 'src/hawtio'),
    },
  },
}
