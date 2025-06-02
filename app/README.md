# @hawtio/react-app

A test application for @hawtio/react development.

## Developer notes

This is a JavaScript application which uses (in `dependencies` of its `package.json`) the _main_
`@hawtio/react` package.

While `@hawtio/react` is an NPM package bundled with `tsup` (`esbuild` + `rollup`), this application is bundled
using `webpack` to produce code running inside browser.

This application not only shortens the dev cycle (change `@hawtio/react` > see results in the browser), it also
shows how other applications ([Hawtio Standalone](https://github.com/hawtio/hawtio/tree/4.x/console) being one of them)

* should be structured
* should use `webpack` and configure [Module Federation](https://webpack.js.org/concepts/module-federation/)
* should initialize and bootstrap `hawtio` classes
* should render initial React application
