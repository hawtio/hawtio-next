# Changelog

All notable changes to this project will be documented in this file. See [commit-and-tag-version](https://github.com/absolute-version/commit-and-tag-version) for commit guidelines.

## [1.0.2](https://github.com/hawtio/hawtio-next/compare/v1.0.1...v1.0.2) (2023-12-20)


### Bug Fixes

* **core:** provide API for plugins to customise hawtconfig programmatically ([852d5e0](https://github.com/hawtio/hawtio-next/commit/852d5e0e946192ef7dbc196a69aecad8e0cabe7c))

## [1.0.1](https://github.com/hawtio/hawtio-next/compare/v1.0.0...v1.0.1) (2023-12-15)


### Bug Fixes

* **camel:** fix camel-model v4 version to 4.0.x lts ([e83d0d3](https://github.com/hawtio/hawtio-next/commit/e83d0d3624031db00beb4d68771d6ba6934330b0))

## [1.0.0](https://github.com/hawtio/hawtio-next/compare/v1.0.0-rc.0...v1.0.0) (2023-12-15)


### Bug Fixes

* add additional check for the redirect to prevent XSS ([d5e9b4b](https://github.com/hawtio/hawtio-next/commit/d5e9b4b929c3f3dd4f76ab64f70be729f3598896))
* **camelContext:** expand tree for routes, endpoints & components ([499e118](https://github.com/hawtio/hawtio-next/commit/499e1186960fa20b0fee9fbcf63408d77668b259))
* code formatting ([496eddd](https://github.com/hawtio/hawtio-next/commit/496edddce494a6ca0b313c7532a0119a0dc94764))

## [1.0.0-rc.0](https://github.com/hawtio/hawtio-next/compare/v0.9.2...v1.0.0-rc.0) (2023-11-29)


### Features

* **springboot-plugin:** Add Loggers tab with posibility to see,filter and customize loggers ([b8ba2cd](https://github.com/hawtio/hawtio-next/commit/b8ba2cd3b7a8829884e0406e3f3e2e4dcf9e2ea5))
* **springboot-plugin:** Add Trace view ([e1cf816](https://github.com/hawtio/hawtio-next/commit/e1cf816d125aab528f23291a42af88bb7187d7dd))
* **springboot-plugin:** Create empty plugin with Health,Loggers,Info,Trace pages ([37675ea](https://github.com/hawtio/hawtio-next/commit/37675ea7024c481671982f1dfcf75f04a75cec51))


### Bug Fixes

* **jmx,camel:** make Operations more robust on potential Jolokia max depth shortage error ([3ff43cc](https://github.com/hawtio/hawtio-next/commit/3ff43cc5299b3a2e8b3a11260f00e458168dd9f6))
* Moves code in useEffect into main body of component [#673](https://github.com/hawtio/hawtio-next/issues/673) ([1f54014](https://github.com/hawtio/hawtio-next/commit/1f5401472e838b1c38d97191303992cc0c5aa8e4))
* **stringSorter:** Use localeCompare in the stringSorter to prevent incorrect sorting when mixed case ([3bce079](https://github.com/hawtio/hawtio-next/commit/3bce07959c06f08f2883bc091cd803ee2f5d60ea))
* **ui:** sidebar plugin navitem doesn't get active when selected ([1c7608e](https://github.com/hawtio/hawtio-next/commit/1c7608eb0dffefb15b993d0afc58e7974fc1f42c))

## [0.9.2](https://github.com/hawtio/hawtio-next/compare/v0.9.1...v0.9.2) (2023-11-16)


### Bug Fixes

* **auth:** export useUser hook for external plugins ([308ce3f](https://github.com/hawtio/hawtio-next/commit/308ce3f5818d1c2bf03aa103ed7267d19177c5b3))
* **jmx,camel:** fix Operations tab crashes when used with Camel JBang ([3f66dd3](https://github.com/hawtio/hawtio-next/commit/3f66dd35c110be810fde96c0a117fdc7d1f8794a)), closes [#670](https://github.com/hawtio/hawtio-next/issues/670)

## [0.9.1](https://github.com/hawtio/hawtio-next/compare/v0.9.0...v0.9.1) (2023-11-15)


### Bug Fixes

* **camel:** debug breakpoint suspension doesn't work with Camel v4 ([784261f](https://github.com/hawtio/hawtio-next/commit/784261f6bddb75b148969142a505150e1648bd92)), closes [#666](https://github.com/hawtio/hawtio-next/issues/666)
* **camel:** reload breakpoints immediately after step in debug ([18170a8](https://github.com/hawtio/hawtio-next/commit/18170a854b481b1e231d69a35df6988c0136efa0))

## [0.9.0](https://github.com/hawtio/hawtio-next/compare/v0.8.0...v0.9.0) (2023-11-14)


### Features

* **connect:** add Discover tab - by Jolokia Discovery MBean ([0fb87dc](https://github.com/hawtio/hawtio-next/commit/0fb87dc30ed8adc0c4b707198935636da3b8b286))
* **connect:** support local JVM listing in Discover tab ([c0d2ba8](https://github.com/hawtio/hawtio-next/commit/c0d2ba8fbd8ce7af9ecc8e0233cc15d642cf4f91)), closes [#30](https://github.com/hawtio/hawtio-next/issues/30)
* **plugin:** add order option to Plugin API to allow controlling presentation order of plugins [#653](https://github.com/hawtio/hawtio-next/issues/653) ([14c0a89](https://github.com/hawtio/hawtio-next/commit/14c0a89749af345f2976880b40285e2fe3f4b5c7))


### Bug Fixes

* **camel,jmx:** fix Camel plugin should precede JMX ([51bb1a2](https://github.com/hawtio/hawtio-next/commit/51bb1a233a8b0b4214d67853c2b0603eeb06920d)), closes [#653](https://github.com/hawtio/hawtio-next/issues/653)

## [0.8.0](https://github.com/hawtio/hawtio-next/compare/v0.7.0...v0.8.0) (2023-11-07)


### Features

* **shared:** support different loading options for workspace via hawtconfig.json ([41acaab](https://github.com/hawtio/hawtio-next/commit/41acaabcf4566171d109a8735c28667017782463)), closes [#421](https://github.com/hawtio/hawtio-next/issues/421)


### Bug Fixes

* **camel:** apply options from preferences ([f5f5cb7](https://github.com/hawtio/hawtio-next/commit/f5f5cb73d53e0b6a199462186b9a058246b12a28)), closes [#409](https://github.com/hawtio/hawtio-next/issues/409)
* **camel:** apply showInflightCounter option from camel preferences ([1097233](https://github.com/hawtio/hawtio-next/commit/1097233d13ab5844756e489324b674ae72e0086a)), closes [#409](https://github.com/hawtio/hawtio-next/issues/409)

## [0.7.0](https://github.com/hawtio/hawtio-next/compare/v0.6.1...v0.7.0) (2023-10-30)


### Features

* **connect:** provide login form for connecting to authenticated remote jolokia ([8490f4f](https://github.com/hawtio/hawtio-next/commit/8490f4f5caddd774b728d1a59d29707f23c07d8e)), closes [#482](https://github.com/hawtio/hawtio-next/issues/482)
* **jmx:** support writing attributes for writable attributes (RW) ([2dab258](https://github.com/hawtio/hawtio-next/commit/2dab258c7054dba032486b6f83ce1a94527f2d89)), closes [#408](https://github.com/hawtio/hawtio-next/issues/408)
* **shared:** jolokiaService.list() to accept path for returning partial set of MBeans ([a31b682](https://github.com/hawtio/hawtio-next/commit/a31b682bef4530e2d0bb1b7096d661be4bf82c32)), closes [#447](https://github.com/hawtio/hawtio-next/issues/447) [hawtio/hawtio#2965](https://github.com/hawtio/hawtio/issues/2965) [hawtio/hawtio#2966](https://github.com/hawtio/hawtio/issues/2966)


### Bug Fixes

* Adds noconsole rule to guard against casual console.log msgs [#625](https://github.com/hawtio/hawtio-next/issues/625) ([50a83c4](https://github.com/hawtio/hawtio-next/commit/50a83c44b5ce1b14dfa492388770a2d18f772178))
* **connect:** change header hint from expandable section to popover ([87b6502](https://github.com/hawtio/hawtio-next/commit/87b650224bccb8b2e2c92220af9fc116379a3425))
* **connect:** reflect remote username for login user ([8d07d9d](https://github.com/hawtio/hawtio-next/commit/8d07d9d6bb3243bfd2b0624d5c94db2725dc8992))
* **connect:** rephrase and polish hint text for Connect plugin ([410a539](https://github.com/hawtio/hawtio-next/commit/410a539f2bfd72f91abe5dfe65eef588eee1d8ba)), closes [#490](https://github.com/hawtio/hawtio-next/issues/490)
* **connect:** Some link texts missing spaces inside sentences ([#630](https://github.com/hawtio/hawtio-next/issues/630)) ([4e6ac92](https://github.com/hawtio/hawtio-next/commit/4e6ac926b8eed27857c555ba8f1eafe4f872f1cc)), closes [#336](https://github.com/hawtio/hawtio-next/issues/336)
* **core:** getBasePath() to always return path without trailing slash '/' ([3d858a6](https://github.com/hawtio/hawtio-next/commit/3d858a6cdb39d171bba4a370f9b0bc6835ccf6b4))
* **jmx:** 'Copy Jolokia URL' in JMX Operations tab should provide full path including host origin ([21ec9eb](https://github.com/hawtio/hawtio-next/commit/21ec9eb2802df71c10d8bbc48bc303e05b1d86fc))
* **jmx:** provide full URL including origin for Jolokia URL in Attribute modal ([13373ed](https://github.com/hawtio/hawtio-next/commit/13373edd2788bc883d020211d3517f32ed41a7f5))
* **shared:** jolokia service list blocked in case of ajax error ([4963ed3](https://github.com/hawtio/hawtio-next/commit/4963ed332cafbb55277880ff2aea5de11a0efa4c))

## [0.6.1](https://github.com/hawtio/hawtio-next/compare/v0.6.0...v0.6.1) (2023-10-18)


### Bug Fixes

* **shared:** jolokia instance is created every time getJolokia() is invoked ([f77048f](https://github.com/hawtio/hawtio-next/commit/f77048f66589f40d5539e04b82b5a751fcec6d53))

## [0.6.0](https://github.com/hawtio/hawtio-next/compare/v0.5.2...v0.6.0) (2023-10-18)


### Features

* Splits HawtioLogin to allow for custom form [#594](https://github.com/hawtio/hawtio-next/issues/594) ([d3ade5d](https://github.com/hawtio/hawtio-next/commit/d3ade5dc99824da1a0abe4b94441e354c3c5a0e3))
* **ui:** HAWNG-11 enable showing app name in header title via hawtconfig.json ([18eb0a5](https://github.com/hawtio/hawtio-next/commit/18eb0a589c365e0ec59023f304c57746d81355c7))


### Bug Fixes

* Avoids circular dependencies while testing with jest [#594](https://github.com/hawtio/hawtio-next/issues/594) ([f9ee47d](https://github.com/hawtio/hawtio-next/commit/f9ee47d9ae3ada114540718c55c98c7c94b107df))
* **Example3:** Remote tooltips in order to avoid [#570](https://github.com/hawtio/hawtio-next/issues/570) ([5da01fd](https://github.com/hawtio/hawtio-next/commit/5da01fde6e270f70094480b4d94a880644a5aa9a))
* Fixes tests to properly observe the userService.isLogin state [#594](https://github.com/hawtio/hawtio-next/issues/594) ([a9cef9a](https://github.com/hawtio/hawtio-next/commit/a9cef9a3499f4d4b36d3cf8bff3e8c7dec689b1c))
* issues related to previous enhancement on HawtioLogin [#594](https://github.com/hawtio/hawtio-next/issues/594) ([4611be8](https://github.com/hawtio/hawtio-next/commit/4611be8e1eff2d7c3b55c6a178802ba1277bbafc))
* lint error for changelog ([6bcaec8](https://github.com/hawtio/hawtio-next/commit/6bcaec8ff813500ba243e75e408564e14747c723))
* Prevents JMX plugin from hanging on resolve [#594](https://github.com/hawtio/hawtio-next/issues/594) ([0234f8c](https://github.com/hawtio/hawtio-next/commit/0234f8c396ae369f9659537ff71a704dfb86959f))
* Ties services to userService to respect login state [#594](https://github.com/hawtio/hawtio-next/issues/594) ([839f565](https://github.com/hawtio/hawtio-next/commit/839f56531107431386ea994579919814781ed97d))

### [0.5.2](https://github.com/hawtio/hawtio-next/compare/v0.5.1...v0.5.2) (2023-10-06)


### Bug Fixes

* **camel:** getBreakpoints op for Camel BacklogDebugger changed between v3 and v4 ([8463006](https://github.com/hawtio/hawtio-next/commit/846300621bd4dd6c58a4dc8b6054792db136ea08))
* findDOMNode is deprecated in StrictMode. in Route/Endpoins tabs by using noWrap ([94e6dc3](https://github.com/hawtio/hawtio-next/commit/94e6dc3eb801725d33e933b6a0c5bceec9ffbd38))
