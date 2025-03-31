# Changelog

All notable changes to this project will be documented in this file. See [commit-and-tag-version](https://github.com/absolute-version/commit-and-tag-version) for commit guidelines.

## [1.9.2](https://github.com/hawtio/hawtio-next/compare/v1.9.1...v1.9.2) (2025-03-31)


### Bug Fixes

* **camel, jmx, quartz:** Added independent scrolling to Tree View [#1380](https://github.com/hawtio/hawtio-next/issues/1380) ([35fb3ba](https://github.com/hawtio/hawtio-next/commit/35fb3ba5f7160bb9e3e009fcf6aa8faad99931b9))
* **camel,jmx:** fixed background for charts view ([859cbb5](https://github.com/hawtio/hawtio-next/commit/859cbb578239fdbab5db9c49edb0dc5befd16411)), closes [#1379](https://github.com/hawtio/hawtio-next/issues/1379)
* **camel:** default view should be Route Diagram ([6152638](https://github.com/hawtio/hawtio-next/commit/6152638634c74d757905746eda67874d0f421efe)), closes [#1378](https://github.com/hawtio/hawtio-next/issues/1378)
* **camel:** newly added endpoint not shown in the endpoints view ([9a41bdb](https://github.com/hawtio/hawtio-next/commit/9a41bdb7aed6e4d9904201bfbcbed53e7557dabd)), closes [#1409](https://github.com/hawtio/hawtio-next/issues/1409)
* **camel:** start/stop routes in Routes redirects to Route Diagram tab ([5178bc0](https://github.com/hawtio/hawtio-next/commit/5178bc03ef8d99a4676811a60624ff65973c7a28)), closes [#1409](https://github.com/hawtio/hawtio-next/issues/1409)
* **help:** Add help tabs for OIDC and Keycloak only if enabled (fixes [#1330](https://github.com/hawtio/hawtio-next/issues/1330)) ([bc798fa](https://github.com/hawtio/hawtio-next/commit/bc798fabc95cfde2553a2e25258adfcbb28ec3b8))
* **springboot-plugin:** Set background to PF5 style. ([#1412](https://github.com/hawtio/hawtio-next/issues/1412)) ([216de10](https://github.com/hawtio/hawtio-next/commit/216de10affe1e629a1e5095089d0814f1cac9328))

## [1.9.1](https://github.com/hawtio/hawtio-next/compare/v1.9.0...v1.9.1) (2025-03-14)


### Bug Fixes

* **camel:** update camel models to 4.8.5 and 4.10.2 ([ea251ee](https://github.com/hawtio/hawtio-next/commit/ea251ee50dd6adcc8573a9f19ae8af67a1f5d52d))

## [1.9.0](https://github.com/hawtio/hawtio-next/compare/v1.8.1...v1.9.0) (2025-03-11)


### Features

* **camel:** support Camel model 4.10 and drop 4.4 ([4d3d153](https://github.com/hawtio/hawtio-next/commit/4d3d153e45b0a0519c441c563f6a84b28f631e4c)), closes [#1367](https://github.com/hawtio/hawtio-next/issues/1367)


### Bug Fixes

* **jolokia:** stop Jolokia instance in JolokiaService.reset() (fixes [#1353](https://github.com/hawtio/hawtio-next/issues/1353)) ([475f30c](https://github.com/hawtio/hawtio-next/commit/475f30ce870a3d563571102d4441318d30a806a3))
* **shared:** fix handling null desc in jmx domain ([f0ca199](https://github.com/hawtio/hawtio-next/commit/f0ca199aa9e28f805b93baf63d57b4cf0a2644c4)), closes [#1349](https://github.com/hawtio/hawtio-next/issues/1349)

## [1.8.1](https://github.com/hawtio/hawtio-next/compare/v1.8.0...v1.8.1) (2025-01-28)

## [1.8.0](https://github.com/hawtio/hawtio-next/compare/v1.7.0...v1.8.0) (2025-01-09)


### Features

* **connect:** enable auto-connect based on preset connections from backend ([1b78eb9](https://github.com/hawtio/hawtio-next/commit/1b78eb9475b0a95dbf6f29e07739ef76dce81513)), closes [hawtio/hawtio#3731](https://github.com/hawtio/hawtio/issues/3731)
* **connect:** make primary tab auto-connect to the first preset connection ([2915289](https://github.com/hawtio/hawtio-next/commit/2915289b156f96287bfaa156332a632c1e2777c7)), closes [hawtio/hawtio#3731](https://github.com/hawtio/hawtio/issues/3731)


### Bug Fixes

* **connect:** 'con=' parameter should also accept connection name ([e3c2889](https://github.com/hawtio/hawtio-next/commit/e3c2889efc924f94d01558dc1ea224907308b86d)), closes [#1285](https://github.com/hawtio/hawtio-next/issues/1285)
* **connect:** better handling of preset-connections path ([39ed52d](https://github.com/hawtio/hawtio-next/commit/39ed52dcd87d26d4b4a2fdfda7b18038f4537f41))
* **console-status:** fix plugin name ([27f0a8d](https://github.com/hawtio/hawtio-next/commit/27f0a8d137389b1856ded74a2b9eb2228b72bd91))
* **console-status:** fix plugin title ([56dad14](https://github.com/hawtio/hawtio-next/commit/56dad14ddc166236bb25ebe5ca97a8e3a94da567))
* **quartz:** fail to fire triggers manually with exception "job does not exist" ([5f477ef](https://github.com/hawtio/hawtio-next/commit/5f477efcf804d98b4674fbd4770af4f9d1fa5704)), closes [#1049](https://github.com/hawtio/hawtio-next/issues/1049)

## [1.7.0](https://github.com/hawtio/hawtio-next/compare/v1.6.0...v1.7.0) (2024-12-20)


### Features

* **connect:** show Camel icon for Camel JBang in Discover ([9912567](https://github.com/hawtio/hawtio-next/commit/9912567a28b08d61047e4d0fc47c358c0a764ae8)), closes [hawtio/hawtio#3698](https://github.com/hawtio/hawtio/issues/3698)


### Bug Fixes

* **#303:** Show total exchanges instead of completed ([45c277d](https://github.com/hawtio/hawtio-next/commit/45c277d3ad6e6db7c4c262b00f2f8185731ec617)), closes [#303](https://github.com/hawtio/hawtio-next/issues/303)
* **AboutModal:** Add backgroung image to aboutModal ([af8ac3c](https://github.com/hawtio/hawtio-next/commit/af8ac3cde2c455936967d3145cdfb818836ae001)), closes [#1031](https://github.com/hawtio/hawtio-next/issues/1031)
* Add missing whitespace between links and text ([072a36f](https://github.com/hawtio/hawtio-next/commit/072a36f3933fed230fe29fa1337a3fb060ed5346))
* **Jolokia:** Support native Jolokia 2.1.x optimization mode (fixes [#3663](https://github.com/hawtio/hawtio-next/issues/3663)) ([#1221](https://github.com/hawtio/hawtio-next/issues/1221)) ([a7ec911](https://github.com/hawtio/hawtio-next/commit/a7ec9110ac7d24d573b02fa78a917afd82037530))
* **monaco:** Do not use CDN version of monaco-editor (fixes [#1186](https://github.com/hawtio/hawtio-next/issues/1186)) ([#1187](https://github.com/hawtio/hawtio-next/issues/1187)) ([f0805fa](https://github.com/hawtio/hawtio-next/commit/f0805fac3bbd82f147afe5c736a4998e0ac0b183))
* **routes-service:** Fetch always statistics from the context, because the stats from the route don't inlcude inflights ([66d126e](https://github.com/hawtio/hawtio-next/commit/66d126e61546bb96a40f1116344dce5d77e22108))
* **test:** downgrade @testing-library/react to fix test flakiness ([a64ae7f](https://github.com/hawtio/hawtio-next/commit/a64ae7fab9250650b404dc812ef2b284740d239a))

## [1.6.0](https://github.com/hawtio/hawtio-next/compare/v1.5.0...v1.6.0) (2024-10-21)


### Features

* Adds better error handling of workspace loading errors ([9b4c600](https://github.com/hawtio/hawtio-next/commit/9b4c600b5ab1f7311754fcf030d7f849fe8f591f))
* **routeDiagram:** Add IDs to the nodes ([459c59e](https://github.com/hawtio/hawtio-next/commit/459c59ede33adab109b5d88a8ce9fd630e78f96a))


### Bug Fixes

* **route-visualization:** edge shoudln't be displayed when stop is used ([e185cd7](https://github.com/hawtio/hawtio-next/commit/e185cd795a63dc350c10274ee3d15c670eccf193))
* Upgrades eslint to v9 and migrate to flat config [#870](https://github.com/hawtio/hawtio-next/issues/870) ([b6c6e5d](https://github.com/hawtio/hawtio-next/commit/b6c6e5de26df23678d730e8b44d7090e16637458))

## [1.5.0](https://github.com/hawtio/hawtio-next/compare/v1.4.0...v1.5.0) (2024-10-02)


### Features

* **camel:** update supported Camel models to 4.4.x and 4.8.x ([4662e74](https://github.com/hawtio/hawtio-next/commit/4662e7424c7efb330da70c50713293d5feb8a003)), closes [#1146](https://github.com/hawtio/hawtio-next/issues/1146)


### Bug Fixes

* **#1125:** Fix scenario with OIDC and remote, authenticated Jolokia agent ([#1126](https://github.com/hawtio/hawtio-next/issues/1126)) ([aadc600](https://github.com/hawtio/hawtio-next/commit/aadc600bbdad00190391e0d4f037537a27657f1e))
* **#635:** Ensure that promise's reject() is called in case of errors ([6fdc294](https://github.com/hawtio/hawtio-next/commit/6fdc2945a803efd74f5fa4630f7b7f895dedd682)), closes [#635](https://github.com/hawtio/hawtio-next/issues/635)
* **security:** Use X-Jolokia-Authorization with XSRF cookies ([d0455b8](https://github.com/hawtio/hawtio-next/commit/d0455b82588564fa565f89f779529e93287983a7))
* **security:** Use X-Jolokia-Authorization with XSRF cookies ([#1138](https://github.com/hawtio/hawtio-next/issues/1138)) ([13d1d85](https://github.com/hawtio/hawtio-next/commit/13d1d8561e1082678abd5107eb1514733f49fe7b))

## [1.4.0](https://github.com/hawtio/hawtio-next/compare/v1.3.0...v1.4.0) (2024-09-13)


### Features

* **RouteDiagram:** Proper visualisation of parallel processing of the multicast ([736cce6](https://github.com/hawtio/hawtio-next/commit/736cce6011ce53c7883b5ed220861829dd1c0e8c))


### Bug Fixes

* add warning for copying not working in insecure contexts ([bdc7f40](https://github.com/hawtio/hawtio-next/commit/bdc7f4078ccb61e50f04acdf039e8a4df67ee494))
* **CPU load:** Fix CPU load showing 0% in Runtime -> Metrics -> System ([ef87d11](https://github.com/hawtio/hawtio-next/commit/ef87d1158a58538b8a4226b98119d4132dd91b2d))
* **deps:** Upgrade to jolokia.js 2.1.7 (typescript, fetch(), no jquery) (closes [#1101](https://github.com/hawtio/hawtio-next/issues/1101)) ([#1111](https://github.com/hawtio/hawtio-next/issues/1111)) ([1658a7b](https://github.com/hawtio/hawtio-next/commit/1658a7b5efcf0bf21c3f27909fd0af21e807f3f1))
* Disable help for disabled plugins ([8c6f3c8](https://github.com/hawtio/hawtio-next/commit/8c6f3c8ed5f101bbf354f5772664db96dc960d94))
* fix format ([94256ee](https://github.com/hawtio/hawtio-next/commit/94256eefa82aef80984237df1c68399b35c239d6))
* **HAWNG-753:** tweak size of the Route Diagram to fill the screen ([5a61c15](https://github.com/hawtio/hawtio-next/commit/5a61c157c0bfe453b1b216666aabe38d5f5d30ea))
* **Quartz:** Remove actions= from the tittle of the cards ([c8c399c](https://github.com/hawtio/hawtio-next/commit/c8c399cb79d41ecd7c7fb354025577a5f170bce9)), closes [#1021](https://github.com/hawtio/hawtio-next/issues/1021)
* **shared:** fix jolokia unwindListResponse after superstruct upgrade ([db76323](https://github.com/hawtio/hawtio-next/commit/db7632313f87be03b71989cac656f1661a5db1dd))
* **shared:** Stop using jquery (for ajax and selection) (closes [#76](https://github.com/hawtio/hawtio-next/issues/76)) ([#1114](https://github.com/hawtio/hawtio-next/issues/1114)) ([f1809c5](https://github.com/hawtio/hawtio-next/commit/f1809c5bdcf51ac08f80f58f3714b194722f5371))
* **ui:** Fix UI inconsistencies ([6edb48b](https://github.com/hawtio/hawtio-next/commit/6edb48ba2ecaab85fa62b70c1de16930c5f3788e))

## [1.3.0](https://github.com/hawtio/hawtio-next/compare/v1.3.0-dev.2...v1.3.0) (2024-07-09)


### Features

* **camel-source:** Make Source editor editable when it's enabled in the CamelContext ([363c651](https://github.com/hawtio/hawtio-next/commit/363c6518ed99b487dff7b98be062ebb8263435b3))
* **Source:** Add warning about the route being editable ([75a6917](https://github.com/hawtio/hawtio-next/commit/75a6917636072f2dba5231ddb7fe9c014aab63e8))


### Bug Fixes

* **camel-plugin:** Catch the exception when formatting the message and throw error notification ([10a0599](https://github.com/hawtio/hawtio-next/commit/10a0599fef4aa2e752174c80d8f3a9ebd742367c))
* **charts:** fix incorrect memory conversions ([45e2117](https://github.com/hawtio/hawtio-next/commit/45e2117eaeec6b61470e30414da33fe5066719b5))
* **HawtioHeader:** Make header toolbar to be fullHeight to look better ([64bc183](https://github.com/hawtio/hawtio-next/commit/64bc183d00813c8eac7cd2d90d75f0ff7e984cb5))
* **Remote:** switch to Kebab style dropdown for remote connection as it was before PF5 upgrade. ([494ce95](https://github.com/hawtio/hawtio-next/commit/494ce9544b49bf229bbf8e3ab6e55cfd9fca63df))
* **tests:** Add @testing-library/dom dependency ([1a38317](https://github.com/hawtio/hawtio-next/commit/1a3831706ae2aa64c3357b315b252e23440c0691))

## [1.3.0-dev.2](https://github.com/hawtio/hawtio-next/compare/v1.3.0-dev.1...v1.3.0-dev.2) (2024-06-14)


### Bug Fixes

* **CamelIcon:** remove defaultProps ([d28acf4](https://github.com/hawtio/hawtio-next/commit/d28acf47705e55a91b4796ca87aaa9c8ed410536))
* **TableHeaders:** add aria-label to non-text table headers to avoid warnings ([c3140c1](https://github.com/hawtio/hawtio-next/commit/c3140c1fb2bf88c12244a747495554f53a05db97))

## [1.3.0-dev.1](https://github.com/hawtio/hawtio-next/compare/v1.3.0-dev.0...v1.3.0-dev.1) (2024-06-11)


### Features

* **shared,jmx:** support serialising long to string in JSON response from Jolokia ([83c71a1](https://github.com/hawtio/hawtio-next/commit/83c71a1c1077f2e74ffaa7e0a300059f4818a916)), closes [#292](https://github.com/hawtio/hawtio-next/issues/292)

## [1.3.0-dev.0](https://github.com/hawtio/hawtio-next/compare/v1.2.2...v1.3.0-dev.0) (2024-05-30)


### Features

* **connect:** Display "connection lost" toast only once. Fixes ([#705](https://github.com/hawtio/hawtio-next/issues/705)) ([#936](https://github.com/hawtio/hawtio-next/issues/936)) ([a25eeba](https://github.com/hawtio/hawtio-next/commit/a25eeba8458957f215d2a874efe69289a9b9416c))
* **connect:** Handle improved session management for proxy connections (hawtio/hawtio[#3178](https://github.com/hawtio/hawtio-next/issues/3178)) ([#948](https://github.com/hawtio/hawtio-next/issues/948)) ([e9b2628](https://github.com/hawtio/hawtio-next/commit/e9b26285a6f2554ae48703cb95cd28b94f3e3b8e))
* **connect:** Improve remote connections handling (closes [#906](https://github.com/hawtio/hawtio-next/issues/906)) ([#932](https://github.com/hawtio/hawtio-next/issues/932)) ([e8ad5b3](https://github.com/hawtio/hawtio-next/commit/e8ad5b3b379f91d1a6a79cbeeb5b225bb4ed7098))
* **pf5-upgrade:** update class names in the CSS files and some icons ([ed02d6a](https://github.com/hawtio/hawtio-next/commit/ed02d6a1f58b6651b5de67365cb876e96a28cc54))
* **pf5-upgrade:** Update onChange function signatures ([755212d](https://github.com/hawtio/hawtio-next/commit/755212d4f2aaa83cbc6972d035d61d3c0d7a3226))
* Upgrade to Patternfly5 ([0a51cd5](https://github.com/hawtio/hawtio-next/commit/0a51cd565d5cdc761bef606ea4c95484b8bad07b))


### Bug Fixes

* **#900:** Add missing aria-labels ([4f57205](https://github.com/hawtio/hawtio-next/commit/4f57205a76b5f3f5d3f5288d7ada6aab53fe07d5)), closes [#900](https://github.com/hawtio/hawtio-next/issues/900)
* **#905:** Polish the Trace view of the camel plugin ([fd7a488](https://github.com/hawtio/hawtio-next/commit/fd7a48846157baafb3a674f37dda25bc2dde7739)), closes [#905](https://github.com/hawtio/hawtio-next/issues/905)
* auth/config response should never cause errors ([3fa9053](https://github.com/hawtio/hawtio-next/commit/3fa9053ea638fbf84a49b519ce6bb4c2ab62f886))
* **camel:** getCamelVersions() to return correct camel model versions ([f7c0698](https://github.com/hawtio/hawtio-next/commit/f7c0698e99e00272fced681e1707abd894ede2f9))
* **connect:** add space after icon in connection status ([c92c87f](https://github.com/hawtio/hawtio-next/commit/c92c87f1760736d4c3e7259c343eba71a25eb342))
* **connect:** Disable "Connect" button in Discovery when in insecure context ([#947](https://github.com/hawtio/hawtio-next/issues/947)) ([45e32ec](https://github.com/hawtio/hawtio-next/commit/45e32ec0119c2ea7b39f8356da093494e4a8c9a0))
* **connect:** HAWNG-487 apply authentication throttling to connect login ([4203663](https://github.com/hawtio/hawtio-next/commit/4203663b1629f089895dc641858ce3703e7c7036))
* **connect:** Manage connections depending on "secure browsing context" (fixes [#832](https://github.com/hawtio/hawtio-next/issues/832)) ([#946](https://github.com/hawtio/hawtio-next/issues/946)) ([8c42118](https://github.com/hawtio/hawtio-next/commit/8c42118d35f0ab8af95b8d4585ef977463354e52))
* **jmx:** Handle MBeanInfo in Jolokia list() when there was error fetching the info (fixes [#902](https://github.com/hawtio/hawtio-next/issues/902)) ([4a4fcf5](https://github.com/hawtio/hawtio-next/commit/4a4fcf55b49a68a1d31e6bb607cc1a3395b3496d))
* **pf5-upgrade-PR:** incporporate requested PR changes, as fixing function signatures in the OperationForm and CamelPreferences ([f7f3f8b](https://github.com/hawtio/hawtio-next/commit/f7f3f8bbf29b8e52a160879eafe060c71acdc74c))
* **shared:** use MBeanInfoError from jolokia.js instead of custom error type ([de1c2f0](https://github.com/hawtio/hawtio-next/commit/de1c2f03aa6151ddc0e9c9b1a65d23fe5f82d358))
* **Source:** Use dynamic height instead of fixed height in pixels ([f6a72f1](https://github.com/hawtio/hawtio-next/commit/f6a72f18bc1476024d70685b7f963be5fd452373))
* **util/crypto:** type fingerprint to string ([062c784](https://github.com/hawtio/hawtio-next/commit/062c784bd080ca7d942da7625807cf3d7a780d1b))

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
