# Changelog

All notable changes to this project will be documented in this file. See [commit-and-tag-version](https://github.com/absolute-version/commit-and-tag-version) for commit guidelines.

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
