// This is our single entry point of the application. Webpack starts from this file and builds up our bundle,
// potentially splitting it into chunks depending on the configuration
//
// The idea is to have JavaScript code statically being part of this file to be loaded in browser very quickly
// If all we used was static `import` statements, everything would be part of single chunk, because only
// the dynamic `import()` creates an "async boundary point". Such boundary is also needed when using Module
// Federation and because we import "react" as shared MF module, we have to use this `import("./bootstrap")`
// trick.
//
// Importing styles first is also a good idea and using `import` ensures proper ordering.
// But mind that even if we import '@patternfly/react-core/dist/styles/base.css' here, the order of PatternFly
// styles won't be predictable - base.css is only a set of basic styles. Styles for particular components
// are imported from these components and these are loaded asynchronously (because of the dynamic `import()`)

import '@hawtio/react/dist/init.css'
import '@hawtio/react/dist/index.css'
import '@patternfly/react-core/dist/styles/base.css'
import './index.css'

// create an async boundary point, so remaining part of the application is loaded from different chunks
// See https://webpack.js.org/concepts/module-federation/#uncaught-error-shared-module-is-not-available-for-eager-consumption
import('./bootstrap')

export {}
