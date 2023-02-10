# Developing Hawtio.next

This document introduces the coding styles and guidelines, development tips, and resources for new contributors to Hawtio.next.

Feedback and suggestions for improvements are always welcome.

## Styles, conventions, and guidelines

- Follow the Conventional Commits for Git commit messages.
  - <https://www.conventionalcommits.org/en/v1.0.0/>
- Minimise dependencies to 3rd-party libraries as much as possible for reducing the impact of CVEs.
  - Do not use Lodash/Underscore. Always check [You don't need Lodash/Underscore](https://you-dont-need.github.io/You-Dont-Need-Lodash-Underscore/).
- Use [ESLint](https://eslint.org/) and [typescript-eslint](https://typescript-eslint.io/) for more detailed code styling.

## How to migrate legacy Hawtio code

The main task of this project is to migrate legacy Hawtio v2 TypeScript code to PatternFly v4 + React.

- [hawtio-core](https://github.com/hawtio/hawtio-core)
- [hawtio-integration](https://github.com/hawtio/hawtio-integration)
- [hawtio-oauth](https://github.com/hawtio/hawtio-oauth)

The basic logic can be used as is, but the legacy Hawtio contains unnecessary code from years of development and it is not desirable to inherit them as they are. Therefore, we need to scrutinise them and migrate only what are really necessary.

### Mapping between legacy Hawtio and Hawtio.next

The legacy Hawtio follows this [AngularJS style guide](https://github.com/toddmotto/angularjs-styleguide/tree/master/typescript).
Each component is structured based on MVC, with the model being plain TypeScript code, the controller being an AngularJS controller and the view corresponding to HTML. The parts that communicate with the server side are implemented as AngularJS services.

In Hawtio.next, controllers and views are implemented as React components. Models and services are implemented in plain TypeScript. The services are guaranteed to be singleton through the ES Modules import mechanism.

Therefore, the migration from legacy Hawtio to Hawtio.next is basically a process of rewriting the AngularJS controllers and HTML to React components and AngularJS services to plain-TypeScript service classes.

#### Mapping example

To give one example, the Attributes feature of the JMX plugin is mapped as follows.

<!-- prettier-ignore-start -->
| MVC | Legacy Hawtio | Hawtio.next |
| --- | ------------- | ----------- |
| Controller & view | [attributes.controller.ts](https://github.com/hawtio/hawtio-integration/blob/main/plugins/jmx/ts/attributes/attributes.controller.ts) <br/> [attributes.html](https://github.com/hawtio/hawtio-integration/blob/main/plugins/jmx/html/attributes/attributes.html) | [Attributes.tsx](https://github.com/hawtio/hawtio-next/blob/main/src/hawtio/plugins/jmx/attributes/Attributes.tsx) |
| Service | [attributes.service.ts](https://github.com/hawtio/hawtio-integration/blob/main/plugins/jmx/ts/attributes/attributes.service.ts) | [attribute-service.ts](https://github.com/hawtio/hawtio-next/blob/main/src/hawtio/plugins/jmx/attributes/attribute-service.ts) |
<!-- prettier-ignore-end -->

### Developing a React component

Choose `FunctionalComponent` as much as possible for implementing a React component. Use [React hooks](https://reactjs.org/docs/hooks-intro.html) for managing view states and side effects.

The current implementation guidelines are as follows:

- Create one [React context](https://beta.reactjs.org/reference/react/useContext) per plugin and convey common states and setters from the context within the plugin instead of propagating properties across sub components.
  - Example: [src/hawtio/plugins/jmx/context.ts](./src/hawtio/plugins/jmx/context.ts)
- Don't use [React reducers](https://beta.reactjs.org/reference/react/useReducer) as I find it as a bit too much for Hawtio. Hawtio doesn't need to manage complex client-side states other than one huge JMX tree. (We can revisit this rule anytime if we find it the other way around.)

## Testing

TBD

## Supporting projects

There are a few supporting projects that Hawtio.next is based on. Although not so frequent, we will still occasionally need to update the projects.

### jolokia.js

<https://github.com/hawtio/jolokia.js>

Type definitions for Jolokia used in Hawtio.next. It would need to evolve along with Hawtio.next development.

### hawtio-backend-middleware

<https://github.com/hawtio/hawtio-backend-middleware>

The Express middleware that is used in the Webpack dev server and serves as a development-time mock for the Hawtio backend, which enables local development with `yarn start` for Hawtio.next.

## Communication and planning

Let's use GitHub Issues for communications including questions, discussing features, and bug reports.

<https://github.com/hawtio/hawtio-next/issues>

## Developer's references

- PatternFly v4 Components: <https://www.patternfly.org/v4/>
- You don't need Lodash/Underscore: <https://you-dont-need.github.io/You-Dont-Need-Lodash-Underscore/>
