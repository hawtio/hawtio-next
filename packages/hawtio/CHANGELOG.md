# Changelog

All notable changes to this project will be documented in this file. See [commit-and-tag-version](https://github.com/absolute-version/commit-and-tag-version) for commit guidelines.

## [1.2.2](https://github.com/hawtio/hawtio-next/compare/v1.2.1...v1.2.2) (2024-04-15)


### Bug Fixes

* **#852:** Make Attributes table sortable ([1d8c882](https://github.com/hawtio/hawtio-next/commit/1d8c882a4a09be027a060c62799b281a9a9f0a47)), closes [#852](https://github.com/hawtio/hawtio-next/issues/852)
* **Contexts:** fix [#845](https://github.com/hawtio/hawtio-next/issues/845) ([26df634](https://github.com/hawtio/hawtio-next/commit/26df6342d8faf2a641319c49d420dac1b0bd7bce))

## [1.2.1](https://github.com/hawtio/hawtio-next/compare/v1.2.0...v1.2.1) (2024-04-05)


### Bug Fixes

* **#809:** Remove unnecessary tooltips for Expand All/Collapse All ([77c8db1](https://github.com/hawtio/hawtio-next/commit/77c8db11fa60550a18b16ec4006f3e03dd74396c)), closes [#809](https://github.com/hawtio/hawtio-next/issues/809)
* **session:** Do not refresh session by clicking around session-expiration modal ([f353923](https://github.com/hawtio/hawtio-next/commit/f35392304bcdbd375a74a630af50dd30669a756a))
* **shared:** HAWNG-612 jmx tree should keep rendering even in presence of malformed mbeans ([3ee4368](https://github.com/hawtio/hawtio-next/commit/3ee436834ef83803e7e17875d4ef697dac782604))

## [1.2.0](https://github.com/hawtio/hawtio-next/compare/v1.1.2...v1.2.0) (2024-03-27)


### Features

* **session:** Add alert window when the session is about to expire. Closes [#822](https://github.com/hawtio/hawtio-next/issues/822) ([9650c01](https://github.com/hawtio/hawtio-next/commit/9650c0162a585f705a55ce81298bd7734ca97291))


### Bug Fixes

* **#827:** Translate primitive Java array types into readable names ([#829](https://github.com/hawtio/hawtio-next/issues/829)) ([eb57d1c](https://github.com/hawtio/hawtio-next/commit/eb57d1c12c9d8de345f1bec06d534330b8d04991)), closes [#827](https://github.com/hawtio/hawtio-next/issues/827)
* **api:** export AttributeTable from shared ([6068e1d](https://github.com/hawtio/hawtio-next/commit/6068e1da6b02f38f45283e8dc0ef987beda05fb9))
* Autofocus login form & allow submit with Enter ([2ff0b4e](https://github.com/hawtio/hawtio-next/commit/2ff0b4e90426e31018344fc301923dac2182f113))
* change code organization in ui/session ([f866b6b](https://github.com/hawtio/hawtio-next/commit/f866b6b3f3040fa054191e4ca8d0369a4402bb28))
* **ci:** fix e2e for hawtio-next for v4.x ([c58eeb7](https://github.com/hawtio/hawtio-next/commit/c58eeb70065d765f1ec10fee6fab5bc71847d86f))
* **ci:** run on correct port on localhost for quarkus & attach app logs ([19a7212](https://github.com/hawtio/hawtio-next/commit/19a7212e0d6c75b0a2401ed30ceaca67e8fbd94d))
* **ci:** use supported java versions for 4.x ([1623613](https://github.com/hawtio/hawtio-next/commit/162361372108f7db6eba784b2b486194e715956e))
* **CLUX-495:** Use TableComposable for attributes and refactor the Attribute modal ([bc9d463](https://github.com/hawtio/hawtio-next/commit/bc9d463540835f15e05342bf1848d6c57b152705))
* **deps:** pin victory libraries more comprehensively ([3ec453d](https://github.com/hawtio/hawtio-next/commit/3ec453dfd02865a05c43f9462e8ad116d6b3e39d))
* fix code style ([e220907](https://github.com/hawtio/hawtio-next/commit/e2209075bd0554bc04d65d3998c3927873211da0))
* **shared:** fix Attributes view not refreshed immediately for external plugins ([a75ffda](https://github.com/hawtio/hawtio-next/commit/a75ffda04a212b3618ca212e58401a7078ef4eec))

## [1.1.2](https://github.com/hawtio/hawtio-next/compare/v1.1.1...v1.1.2) (2024-03-15)


### Features

* **auth:** Do not log.info a login state ([9a29de8](https://github.com/hawtio/hawtio-next/commit/9a29de88b0aabcc1bf5ce9c5caeadd0fc16316eb))


### Bug Fixes

* **HAWNG-571:** Runtime/Threads UX changes ([07d7620](https://github.com/hawtio/hawtio-next/commit/07d7620fd403bb7df189deb386a58a1ba7dd5db3))
* **ui:** export HawtioLoadingPage as part of Hawtio API ([b3d5ff1](https://github.com/hawtio/hawtio-next/commit/b3d5ff1a4a9db3515bc57abbab94fd46a92b3e0e)), closes [hawtio/hawtio-online#387](https://github.com/hawtio/hawtio-online/issues/387)

## [1.1.1](https://github.com/hawtio/hawtio-next/compare/v1.1.0...v1.1.1) (2024-03-11)


### Bug Fixes

* **api:** export types from auth/user-serivce.ts ([8363283](https://github.com/hawtio/hawtio-next/commit/83632832f6b53ede63dcf5efef4ae7c69e66dccc))

## [1.1.0](https://github.com/hawtio/hawtio-next/compare/v1.0.7...v1.1.0) (2024-03-08)


### Features

* **auth:** Fix token refresh scenario ([b132958](https://github.com/hawtio/hawtio-next/commit/b1329584151fd89751b6a16d7731395d66bbfffc))
* **auth:** just mock oauth4webapi (it's ES module not working with jest) ([d8bbae2](https://github.com/hawtio/hawtio-next/commit/d8bbae21f96fe03e2bd662ee9c03efe34883d95a))
* **auth:** OIDC authentication works with server side support ([537ae18](https://github.com/hawtio/hawtio-next/commit/537ae180fe201faa55b6b405e9524647d9446cd1))
* **auth:** Remove unnecessary AbortController and use isLoading flag in less places ([3b85bfd](https://github.com/hawtio/hawtio-next/commit/3b85bfd698a39b7652a6e77dc229e01e5d2e4c95))
* **auth:** Working Azure OIDC authentication (work in progress, hardcoded config) ([99005f4](https://github.com/hawtio/hawtio-next/commit/99005f4dbce69ae318b69c0cd07e819de46c3bff))
* **camel:** upgrade Camel models to 4.0.4 and 4.4.0 ([eb04807](https://github.com/hawtio/hawtio-next/commit/eb04807eacb511d7a9d06b52e06ac0d04837b4c0)), closes [#800](https://github.com/hawtio/hawtio-next/issues/800)


### Bug Fixes

* **app:** plugin path should start with '/' ([7c2ccc7](https://github.com/hawtio/hawtio-next/commit/7c2ccc7e4e1a8ae0390cf42cf4b3d087ffa85306)), closes [hawtio/hawtio-operator#111](https://github.com/hawtio/hawtio-operator/issues/111)
* **HAWNG-514:** Change icons for Collapse and Expand to links ([be16ff4](https://github.com/hawtio/hawtio-next/commit/be16ff46a4f1501a6d48bf05c171422e5edbd20c))
* yarn dedupe to fix lint ([3721466](https://github.com/hawtio/hawtio-next/commit/372146603214a2c21eb3726d81435956b90f01fb))

## [1.0.7](https://github.com/hawtio/hawtio-next/compare/v1.0.6...v1.0.7) (2024-02-21)


### Bug Fixes

* **api:** expose each builtin plugin's entry point to the public API ([470a6cb](https://github.com/hawtio/hawtio-next/commit/470a6cbc867ba049838242b742286c46a44a234f)), closes [#788](https://github.com/hawtio/hawtio-next/issues/788)
* **core:** branding css cannot override PatternFly styles with :root selector ([db6e857](https://github.com/hawtio/hawtio-next/commit/db6e857a43e6f766cae9e335f9da72a98e169f62)), closes [#787](https://github.com/hawtio/hawtio-next/issues/787)
* **core:** cannot add productInfo to hawtconfig when about is absent ([47d7d15](https://github.com/hawtio/hawtio-next/commit/47d7d157d5514bc241ecf360947aa224c019092d)), closes [#715](https://github.com/hawtio/hawtio-next/issues/715)

## [1.0.6](https://github.com/hawtio/hawtio-next/compare/v1.0.5...v1.0.6) (2024-02-16)


### Bug Fixes

* **ui:** HAWNG-222 block login form based on 429 response Retry-After from /auth/login ([468d2ac](https://github.com/hawtio/hawtio-next/commit/468d2accd4f0a8bd9e333cc2e9a9debb099476e3))

## [1.0.5](https://github.com/hawtio/hawtio-next/compare/v1.0.4...v1.0.5) (2024-02-09)


### Bug Fixes

* **deps:** downgrade to @patternfly/react-charts 6.x and @patternfly/react-code-editor 4.x ([793a2f4](https://github.com/hawtio/hawtio-next/commit/793a2f4c3bb2f7f3be6865b7929a50f12a9d83fb))

## [1.0.4](https://github.com/hawtio/hawtio-next/compare/v1.0.3...v1.0.4) (2024-02-08)


### Bug Fixes

* **connect:** HAWNG-441 encrypt session storage ([8ecb827](https://github.com/hawtio/hawtio-next/commit/8ecb8275c5b8641142c6fb4f92043f58b357b13d))
* **connect:** HAWNG-474 make sure only http(s) is used for connection scheme ([97500b3](https://github.com/hawtio/hawtio-next/commit/97500b3960b5a05d8eaaa8358161ec39ea7f7cb4))

## [1.0.3](https://github.com/hawtio/hawtio-next/compare/v1.0.2...v1.0.3) (2023-12-21)


### Bug Fixes

* **core:** branding should be applied after loading plugins ([14e83cd](https://github.com/hawtio/hawtio-next/commit/14e83cdab7374873678e026b636c25259c9e7f64))

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
