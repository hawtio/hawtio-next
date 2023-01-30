import { ISimpleOptions } from 'jolokia.js'
import jolokiaResponse from './jolokia-data.json'

class MockJolokiaService {
  constructor() {
    console.log('Using mock jolokia service')
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async list(options: ISimpleOptions): Promise<unknown> {
    return new Promise<unknown>((resolve) => {
      resolve(jolokiaResponse)
    })
  }
}

export const jolokiaService = new MockJolokiaService()
