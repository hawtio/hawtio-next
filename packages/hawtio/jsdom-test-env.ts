/* eslint-disable import/no-default-export */

import JSDOMEnvironment from 'jest-environment-jsdom'

/**
 * Workaround for https://github.com/jsdom/jsdom/issues/3363
 */
export default class JSDOMEnvironmentForStructuredClone extends JSDOMEnvironment {
  constructor(...args: ConstructorParameters<typeof JSDOMEnvironment>) {
    super(...args)
    this.global.structuredClone = structuredClone
  }
}
