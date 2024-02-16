const { ModuleFederationPlugin } = require('webpack').container
const MonacoWebpackPlugin = require('monaco-editor-webpack-plugin')
const CracoEsbuildPlugin = require('craco-esbuild')
const { dependencies } = require('./package.json')
const { hawtioBackend } = require('@hawtio/backend-middleware')
const bodyParser = require('body-parser')

module.exports = {
  plugins: [{ plugin: CracoEsbuildPlugin }],
  webpack: {
    plugins: {
      add: [
        new ModuleFederationPlugin({
          name: 'app',
          filename: 'remoteEntry.js',
          exposes: {
            './remote': './src/examples/remote',
          },
          shared: {
            ...dependencies,
            react: {
              singleton: true,
              requiredVersion: dependencies['react'],
            },
            'react-dom': {
              singleton: true,
              requiredVersion: dependencies['react-dom'],
            },
            'react-router-dom': {
              singleton: true,
              requiredVersion: dependencies['react-router-dom'],
            },
            '@hawtio/react': {
              singleton: true,
              // Hardcoding needed because it cannot handle yarn 'workspace:*' version
              requiredVersion: '^1.0.0',
            },
          },
        }),
        new MonacoWebpackPlugin({
          // 'html' is required as workaround for 'xml'
          // https://github.com/microsoft/monaco-editor/issues/1509
          languages: ['xml', 'json', 'html', 'plaintext'],
          globalAPI: true,
        }),
      ],
    },
    configure: webpackConfig => {
      // Required for Module Federation
      webpackConfig.output.publicPath = 'auto'

      webpackConfig.ignoreWarnings = [
        // For suppressing sourcemap warnings coming from some dependencies
        /Failed to parse source map/,
        /Critical dependency: the request of a dependency is an expression/,
      ]

      webpackConfig.resolve = {
        ...webpackConfig.resolve,
        fallback: {
          path: require.resolve('path-browserify'),
          os: require.resolve('os-browserify'),
        },
      }

      // MiniCssExtractPlugin - Ignore order as otherwise conflicting order warning is raised
      const miniCssExtractPlugin = webpackConfig.plugins.find(p => p.constructor.name === 'MiniCssExtractPlugin')
      if (miniCssExtractPlugin) {
        miniCssExtractPlugin.options.ignoreOrder = true
      }

      // ***** Debugging *****
      /*
      const fs = require('fs')
      const util = require('node:util')
      const out = `output = ${util.inspect(webpackConfig.output)}\n\nplugins = ${util.inspect(webpackConfig.plugins)}`
      fs.writeFile('__webpackConfig__.txt', out, err => err && console.error(err))
      */
      // ***** Debugging *****

      return webpackConfig
    },
  },
  jest: {
    configure: {
      // Automatically clear mock calls and instances between every test
      clearMocks: true,

      coveragePathIgnorePatterns: [
        '<rootDir>/node_modules/',
        '<rootDir>/src/hawtio/test/',
        '<rootDir>/src/hawtio/.*/ignore/.*',
      ],

      moduleDirectories: ['<rootDir>/node_modules/', '<rootDir>/src/hawtio/test/'],

      moduleNameMapper: {
        'react-markdown': '<rootDir>/node_modules/react-markdown/react-markdown.min.js',
      },

      // The path to a module that runs some code to configure or set up the testing framework before each test
      setupFilesAfterEnv: ['<rootDir>/src/setupTests.ts'],

      testPathIgnorePatterns: [
        '<rootDir>/node_modules/',
        '<rootDir>/src/hawtio/test/',
        '<rootDir>/src/hawtio/.*/ignore/.*',
      ],

      transformIgnorePatterns: ['node_modules/(?!@patternfly/react-icons/dist/esm/icons)/'],

      coveragePathIgnorePatterns: ['node_modules/', 'src/examples/', 'src/index.tsx', 'src/reportWebVitals.ts'],
    },
  },
  devServer: {
    setupMiddlewares: (middlewares, devServer) => {
      devServer.app.use(bodyParser.json())

      // Redirect / or /hawtio to /hawtio/
      devServer.app.get('/', (_, res) => res.redirect('/hawtio/'))
      devServer.app.get('/hawtio$', (_, res) => res.redirect('/hawtio/'))

      const username = 'developer'
      const login = true
      const proxyEnabled = true
      // TODO: Currently self-hosting remotes don't work despite no errors thrown
      const plugin = [
        {
          url: 'http://localhost:3000',
          scope: 'app',
          module: './remote',
          pluginEntry: 'registerRemote',
        },
      ]
      // Keycloak
      const keycloakEnabled = false
      const keycloakClientConfig = {
        realm: 'hawtio-demo',
        clientId: 'hawtio-client',
        url: 'http://localhost:18080/',
        jaas: false,
        pkceMethod: 'S256',
      }

      // Hawtio backend API mock
      let authenticated = true
      devServer.app.get('/hawtio/user', (_, res) => {
        if (authenticated) {
          res.send(`"${username}"`)
        } else {
          res.sendStatus(403)
        }
      })
      devServer.app.post('/hawtio/auth/login', (req, res) => {
        // Test authentication throttling with username 'throttled'
        const { username } = req.body
        if (username === 'throttled') {
          res.append('Retry-After', 10) // 10 secs
          res.sendStatus(429)
          return
        }

        authenticated = true
        res.send(String(login))
      })
      devServer.app.get('/hawtio/auth/logout', (_, res) => {
        authenticated = false
        res.redirect('/hawtio/login')
      })
      devServer.app.get('/hawtio/proxy/enabled', (_, res) => res.send(String(proxyEnabled)))
      devServer.app.get('/hawtio/plugin', (_, res) => res.send(JSON.stringify(plugin)))
      devServer.app.get('/hawtio/keycloak/enabled', (_, res) => res.send(String(keycloakEnabled)))
      devServer.app.get('/hawtio/keycloak/client-config', (_, res) => res.send(JSON.stringify(keycloakClientConfig)))
      devServer.app.get('/hawtio/keycloak/validate-subject-matches', (_, res) => res.send('true'))

      // Hawtio backend middleware should be run before other middlewares (thus 'unshift')
      // in order to handle GET requests to the proxied Jolokia endpoint.
      middlewares.unshift({
        name: 'hawtio-backend',
        path: '/hawtio/proxy',
        middleware: hawtioBackend({
          // Uncomment it if you want to see debug log for Hawtio backend
          logLevel: 'debug',
        }),
      })

      return middlewares
    },
  },
}
