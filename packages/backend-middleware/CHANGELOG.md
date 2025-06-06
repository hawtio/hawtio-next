# Changelog

All notable changes to this project will be documented in this file. See [commit-and-tag-version](https://github.com/absolute-version/commit-and-tag-version) for commit guidelines.

## 1.0.6 (2024-11-27)

### Bug Fixes

* **backend-middleware:** translate X-Jolokia-Authorization header to Authorization when contacting proxy ([13d1d85](https://github.com/hawtio/hawtio-next/commit/13d1d8561e1082678abd5107eb1514733f49fe7b))

## 1.0.5 (2024-04-23)

### Bug Fixes

* **backend-middleware:** propagate 429 errors for connect login throttling ([f7f9634](https://github.com/hawtio/hawtio-next/commit/f7f9634ebc004ee7b2466fabbc181c4a5b27a7ee))

## [1.0.4](https://github.com/hawtio/hawtio-backend-middleware/compare/v1.0.3...v1.0.4) (2023-10-24)

### Bug Fixes

* propagate 40x errors from the target correctly ([bb00ac6](https://github.com/hawtio/hawtio-backend-middleware/commit/bb00ac69f9d22037c2f5d7411861f82a90ec691b))

## [1.0.3](https://github.com/hawtio/hawtio-backend-middleware/compare/v1.0.2...v1.0.3) (2022-10-30)

### Bug Fixes

* build files not included with yarn pack ([c56f658](https://github.com/hawtio/hawtio-backend-middleware/commit/c56f6583e82957e09dce8111b9d3c30f72fa7377))

## [1.0.2](https://github.com/hawtio/hawtio-backend-middleware/compare/v1.0.1...v1.0.2) (2022-10-30)

### Bug Fixes

* fix spelling lint ([5d9d4b7](https://github.com/hawtio/hawtio-backend-middleware/commit/5d9d4b77028b42b6a78d788f4db215997f02901a))
* version back to 1.0.1 ([22dbc91](https://github.com/hawtio/hawtio-backend-middleware/commit/22dbc91c9c445869aece0f89f255588a123b8d00))

## [1.0.1](https://github.com/tadayosi/hawtio-backend-middleware/compare/v1.0.0...v1.0.1) (2022-10-06)

### Bug Fixes

* don't append ? when query is empty ([638dc59](https://github.com/tadayosi/hawtio-backend-middleware/commit/638dc5943a97316c21b87a5109bd361bc3d5970f))
* fix proxy ([63c2cbd](https://github.com/tadayosi/hawtio-backend-middleware/commit/63c2cbd282016f82c4a4852e8fbb00ea83ab167d))
* fix query parsing ([31396c7](https://github.com/tadayosi/hawtio-backend-middleware/commit/31396c772683eafb8fe5df402cbefe81ac02f814))
* make sure to set logLevel=INFO by default ([50e3b78](https://github.com/tadayosi/hawtio-backend-middleware/commit/50e3b785907d9b65d2b8b4acc3b2d23d498b8d57))
