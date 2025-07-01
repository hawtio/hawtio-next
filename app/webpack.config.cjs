const { ModuleFederationPlugin } = require('webpack').container
const HtmlWebpackPlugin = require('html-webpack-plugin')
const CopyWebpackPlugin = require('copy-webpack-plugin')
const MonacoWebpackPlugin = require('monaco-editor-webpack-plugin')
const { dependencies } = require('./package.json')
const { hawtioBackend } = require('@hawtio/backend-middleware')
const path = require('path')
const bodyParser = require('body-parser')

const publicPath = '/hawtio'
const outputPath = path.resolve(__dirname, 'build')

module.exports = (_, args) => {
  const isProduction = args.mode === 'production'
  return [
  // this is the "main" webpack configuration which builds entire application
  {
    entry: './src/index',

    /*
     * To debug in development with source maps
     * update accordingly
     *
     * For other alternatives see
     * https://webpack.js.org/configuration/devtool
     */
    devtool: isProduction ? 'source-map' : false,
    plugins: [
      new ModuleFederationPlugin({
        // _host_ is an application that can:
        //  - consume modules from "remotes" (ContainerReferencePlugin)
        //  - provide modules from "exposes" (ContainerPlugin)
        //
        // "name" is required only if the _host_ uses "exposes" and it creates:
        // "webpack/container/entry/app" module
        name: 'app',
        // "filename" is only for ContainerPlugin (for "exposes") - regardles of the number of exposed modules
        // we have single "remoteEntry.js" file
        filename: 'remoteEntry.js',
        exposes: {
          './remote1': './src/examples/remote1',
          './remote2': './src/examples/remote2'
        },
        // keys in this map are used in `webpack/container/reference/${key}` pattern
        // the part before "@" should match "name" of some (could be different, but also this very same, as here)
        // ModuleFederationPlugin configuration. We could simply have this webpack.config.cjs provide more
        // configurations - each with own ModuleFederationPluginConfiguration
        // so here "app" maatches our own ModuleFederationPlugin config's "name"
        remotes: {
          "static-remotes": "app@http://localhost:3000/hawtio/remoteEntry.js"
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
            requiredVersion: '1.9.2'
          },
          '@patternfly/react-core': {
            singleton: true,
            requiredVersion: dependencies['@patternfly/react-core']
          }
        },
      }),
      new HtmlWebpackPlugin({
        template: path.resolve(__dirname, 'public/index.html'),
        favicon: path.resolve(__dirname, 'public/favicon.ico'),
        // Trailing slash is really important for proper base path handling
        base: publicPath + '/',
        publicPath,
        // this ensures that we don't have <script> tag for "remoteEntry.js"
        // which is loaded by different means (by webpack code itself, without
        // adding static <script> element to <head>
        chunks: ["main"]
      }),
      new CopyWebpackPlugin({
        patterns: [
          {
            from: '**/*',
            to: outputPath,
            context: 'public/',
            globOptions: {
              gitignore: true,
              ignore: ['**/index.html', '**/favicon.ico'],
            },
          },
        ],
      }),
      new MonacoWebpackPlugin({
        // 'html' is required as workaround for 'xml'
        // https://github.com/microsoft/monaco-editor/issues/1509
        languages: ['xml', 'json', 'html', 'plaintext'],
        globalAPI: true,
      }),
    ],
    output: {
      clean: true,
      path: outputPath,
      publicPath: 'auto',
      filename: isProduction ? 'static/js/[name].[contenthash:8].js' : 'static/js/bundle.js',
      chunkFilename: isProduction ? 'static/js/[name].[contenthash:8].chunk.js' : 'static/js/[name].chunk.js',
      assetModuleFilename: 'static/media/[name].[hash][ext]',
    },
    module: {
      rules: [
        {
          test: /\.tsx?$/,
          exclude: /node_modules/,
          use: {
            loader: 'swc-loader',
            options: {
              jsc: {
                parser: {
                  syntax: 'typescript',
                },
              },
            },
          },
        },
        {
          test: /\.js$/,
          enforce: 'pre',
          use: ['source-map-loader'],
        },
        {
          test: /\.css$/i,
          use: ['style-loader', 'css-loader'],
        },
        {
          test: /\.(png|svg|jpg|jpeg|gif)$/i,
          type: 'asset/resource',
        },
        {
          test: /\.(woff|woff2|eot|ttf|otf)$/i,
          type: 'asset/resource',
        },
        {
          test: /\.md$/i,
          type: 'asset/source',
        },
      ],
    },
    resolve: {
      extensions: ['.ts', '.tsx', '.js', '.jsx'],
    },
    ignoreWarnings: [
      // For suppressing sourcemap warnings coming from some dependencies
      /Failed to parse source map/,
      /Critical dependency: the request of a dependency is an expression/,
    ],
    performance: {
      maxAssetSize: 1000000, // 1MB for now
    },
    devServer: {
      port: 3000,
      static: path.join(__dirname, 'public'),
      historyApiFallback: {
        // Needed to fallback to bundled index instead of public/index.html template
        index: publicPath,
      },
      devMiddleware: { publicPath },
      setupMiddlewares: (middlewares, devServer) => {
        devServer.app.use(bodyParser.json())

        // Redirect / or /hawtio to /hawtio/
        if (publicPath && publicPath !== '/') {
          devServer.app.get('/', (_, res) => res.redirect(`${publicPath}/`))
          devServer.app.get(`${publicPath}$`, (_, res) => res.redirect(`${publicPath}/`))
        }

        let username = 'developer'
        const proxyEnabled = true
        // TODO: Currently self-hosting remotes don't work despite no errors thrown
        const plugin = [
          {
            url: 'http://localhost:3000/hawtio',
            scope: 'appRemote',
            module: './remote3',
            remoteEntryFileName: "remoteExternalEntry.js",
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
        let login = true
        devServer.app.get(`${publicPath}/user`, (_, res) => {
          if (login) {
            res.send(`"${username}"`)
          } else {
            res.sendStatus(403)
          }
        })
        devServer.app.post(`${publicPath}/auth/login`, (req, res) => {
          // Test authentication throttling with username 'throttled'
          const cred = req.body
          if (cred.username === 'throttled') {
            res.append('Retry-After', 10) // 10 secs
            res.sendStatus(429)
            return
          }

          login = true
          username = cred.username
          res.send(String(login))
        })
        devServer.app.get(`${publicPath}/auth/logout`, (_, res) => {
          login = false
          username = null
          res.redirect(`${publicPath}/login`)
        })

        const oidcEnabled = false
        const oidcConfig = {
          method: 'oidc',
          provider: 'https://login.microsoftonline.com/11111111-2222-3333-4444-555555555555/v2.0',
          client_id: '66666666-7777-8888-9999-000000000000',
          response_mode: 'fragment',
          scope: 'openid email profile api://hawtio-server/Jolokia.Access',
          redirect_uri: 'http://localhost:3000/hawtio/',
          code_challenge_method: 'S256',
          prompt: 'login',
        }
        devServer.app.get(`${publicPath}/auth/config`, (_, res) => {
          res.type('application/json')
          if (oidcEnabled) {
            res.send(JSON.stringify(oidcConfig))
          } else {
            res.send('{}')
          }
        })
        devServer.app.get(`${publicPath}/auth/config/session-timeout`, (_, res) => {
          res.type('application/json')
          res.send('{}')
        })
        devServer.app.get(`${publicPath}/proxy/enabled`, (_, res) => res.send(String(proxyEnabled)))
        devServer.app.get(`${publicPath}/plugin`, (_, res) => res.send(JSON.stringify(plugin)))
        devServer.app.get(`${publicPath}/keycloak/enabled`, (_, res) => res.send(String(keycloakEnabled)))
        devServer.app.get(`${publicPath}/keycloak/client-config`, (_, res) =>
          res.send(JSON.stringify(keycloakClientConfig)),
        )
        devServer.app.get(`${publicPath}/keycloak/validate-subject-matches`, (_, res) => res.send('true'))

        // Testing preset connections
        /*
        devServer.app.get(`${publicPath}/preset-connections`, (_, res) => {
          res.type('application/json')
          res.send(
            JSON.stringify([
              { name: 'test1', scheme: 'http', host: 'localhost', port: 8778, path: '/jolokia/' },
              { name: 'test2' },
            ]),
          )
        })
        */

        // Hawtio backend middleware should be run before other middlewares (thus 'unshift')
        // in order to handle GET requests to the proxied Jolokia endpoint.
        middlewares.unshift({
          name: 'hawtio-backend',
          path: `${publicPath}/proxy`,
          middleware: hawtioBackend({
            // Uncomment it if you want to see debug log for Hawtio backend
            logLevel: 'debug',
          }),
        })

        return middlewares
      },
    },
  },
  // this is very slim configuration which only builds a file used as exposed entry point for ModuleFederation plugin
  // which will be loaded dynamically by Hawtio using @module-federation/utiliites
  {
    entry: './src/examples/remote3',
    devtool: false,
    plugins: [
      new ModuleFederationPlugin({
        name: 'appRemote',
        filename: 'remoteExternalEntry.js',
        exposes: {
          './remote3': './src/examples/remote3'
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
            requiredVersion: '1.9.2'
          },
          '@patternfly/react-core': {
            singleton: true,
            requiredVersion: dependencies['@patternfly/react-core']
          }
        },
      }),
    ],
    output: {
      clean: true,
      path: path.resolve(__dirname, 'build-remote'),
      publicPath: 'auto',
      filename: isProduction ? 'static/js/[name].[contenthash:8].js' : 'static/js/bundle.js',
      chunkFilename: isProduction ? 'static/js/[name].[contenthash:8].chunk.js' : 'static/js/[name].chunk.js',
      assetModuleFilename: 'static/media/[name].[hash][ext]',
      uniqueName: 'module-federation-external-module'
    },
    resolve: {
      extensions: ['.ts', '.tsx', '.js', '.jsx'],
    },
    module: {
      rules: [
        {
          test: /\.tsx?$/,
          exclude: /node_modules/,
          use: {
            loader: 'swc-loader',
            options: {
              jsc: {
                parser: {
                  syntax: 'typescript',
                },
              },
            },
          },
        },
        {
          test: /\.css$/i,
          use: ['style-loader', 'css-loader'],
        },
        {
          test: /\.(png|svg|jpg|jpeg|gif)$/i,
          type: 'asset/resource',
        },
        {
          test: /\.(woff|woff2|eot|ttf|otf)$/i,
          type: 'asset/resource',
        },
        {
          test: /\.md$/i,
          type: 'asset/source',
        },
      ],
    },
  }]
}
