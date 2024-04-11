# Hawtio.next

[![Test](https://github.com/hawtio/hawtio-next/actions/workflows/test.yml/badge.svg)](https://github.com/hawtio/hawtio-next/actions/workflows/test.yml)
[![E2E Test](https://github.com/hawtio/hawtio-next/actions/workflows/e2e-test.yml/badge.svg)](https://github.com/hawtio/hawtio-next/actions/workflows/e2e-test.yml)
[![Lint](https://github.com/hawtio/hawtio-next/actions/workflows/lint.yml/badge.svg)](https://github.com/hawtio/hawtio-next/actions/workflows/lint.yml)

A Hawtio reimplementation based on TypeScript + React.
This project reimplements the following Hawtio JS components in one project:

- [hawtio-core](https://github.com/hawtio/hawtio-core)
- [hawtio-integration](https://github.com/hawtio/hawtio-integration)
- [hawtio-oauth](https://github.com/hawtio/hawtio-oauth)

## Development

This project uses [tsup](https://tsup.egoist.dev/) and [Webpack](https://webpack.js.org/) for building packages.

See also [Developing Hawtio.next](./docs/developing.md) for the project styling, guidelines, and more details on development.

### Prerequisites

You need to have installed the following tools before developing the project.

- [Node.js >= 18](https://nodejs.org/en/)
- [Yarn v4](https://yarnpkg.com/getting-started/install)

<!-- prettier-ignore -->
> [!IMPORTANT]
> **Building requires Yarn Berry (v2+).**
> The default installation version of yarn on many operating systems is _1.22.19_ (the classic version). This might cause a problem when building the project. As a result, the mandated minimum version has been set to _4.0.0_.
>
> If `yarn install` is attempted with a version lower than _4.0.0_ then an error message is displayed, eg.
>
> ```console
> $ /usr/bin/yarn install
> yarn install v1.22.19
> [1/5] Validating package.json...
> error @hawtio/next-root@0.0.0: The engine "yarn" is incompatible with this module. Expected version ">=4". Got "1.22.19"
> error Found incompatible module.
> ```
>
> If you have enabled `corepack` already, the project should automatically use [the version of yarn committed to the repository itself](.yarn/releases/yarn-4.0.1.cjs).
>
> ```console
> corepack enable
> ```
>
> ```console
> $ yarn --version
> 4.0.1
> ```

### Developing

After checking out the project, run the following command to set up the project dependencies.

```console
yarn install
```

Then, build the whole project first.

```console
yarn build:all
```

You can start developing the project by running the following command and then opening <http://localhost:3000/> in the browser.

```console
yarn start
```

Then run another Java application which has a Jolokia endpoint from a different terminal, and connect to it from the Connect tab in the Hawtio console. For example, you can run [this Spring Boot example](https://github.com/hawtio/hawtio/tree/main/examples/springboot) in background.

```console
mvn spring-boot:run
```

You can connect to this example application at the Jolokia URL: <http://localhost:10001/actuator/hawtio/jolokia>. Open the Connect tab and create a connection with the following parameters:

- Name: \<any name\>
- Scheme: HTTP
- Host: `localhost`
- Port: `10001`
- Path: `/actuator/hawtio/jolokia`

### Building

To build the project for production, run the following command. It's built into the `build/` directory.

```console
yarn build:all
```

### Testing

To execute the unit tests, run the following command.

```console
yarn test:all
```

### Linting

It is recommended to run linting against the code periodically with the following command.

```console
yarn lint && yarn format:check
```

### E2E

Read [Running E2E tests locally](./docs/e2e.md).

### Contributing

When making a PR E2E tests from hawtio/hawtio will be run against your frontend.
If you want to specify a different branch to run the tests from you can add
`` `branch: [remote:]branch` `` to the PR description, ie. `branch: e2e-test-fix` or in your own fork `branch: jdoe:my-branch`.
