import {
  DEFAULT_MAX_COLLECTION_SIZE,
  DEFAULT_MAX_DEPTH,
  JolokiaListMethod,
  jolokiaService,
  __testing_jolokia_service__,
} from './jolokia-service'
import { IJolokia, IListOptions, IErrorResponse } from 'jolokia.js'

const { JolokiaService, DummyJolokia } = __testing_jolokia_service__

class ListJolokiaTest extends DummyJolokia {
  private fireSuccess = true

  constructor(fireSuccess: boolean) {
    super()
    this.fireSuccess = fireSuccess
  }

  list(path: string, opts?: IListOptions) {
    if (!opts) throw new Error('No options set')

    if (this.fireSuccess) {
      if (!opts.success) throw new Error('No success option set')

      opts.success({
        desc: '',
        attr: {},
        op: {
          value: { desc: 'exec', args: [], ret: '' },
        },
      })
    } else {
      if (!opts.error) throw new Error('No error option set')

      const response: IErrorResponse = {
        status: -1,
        timestamp: 123456789,
        request: { type: 'list', path: path },
        value: null,
        error_type: 'non-exist',
        error: 'ERROR HAS OCCURRED',
        stacktrace: 'not available',
      }

      opts.error(response)
    }

    return null
  }
}

class JolokiaServiceTest extends JolokiaService {
  checkListOptimisationTest(jolokia: IJolokia): Promise<void> {
    return this.checkListOptimisation(jolokia)
  }
}

describe('JolokiaService class', () => {
  test('checkListOptimizationSuccess', async () => {
    const delegate: ListJolokiaTest = new ListJolokiaTest(true)
    const service: JolokiaServiceTest = new JolokiaServiceTest()

    console.log(service.getListMethod())

    await expect(service.checkListOptimisationTest(delegate)).resolves.not.toThrow()
    expect(await service.getListMethod()).toEqual(JolokiaListMethod.OPTIMISED)
  })

  test('checkListOptimizationError', async () => {
    const delegate: ListJolokiaTest = new ListJolokiaTest(false)
    const service: JolokiaServiceTest = new JolokiaServiceTest()

    await expect(service.checkListOptimisationTest(delegate)).resolves.not.toThrow()
    expect(await service.getListMethod()).toEqual(JolokiaListMethod.DEFAULT)
  })
})

describe('jolokiaService singleton', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  test('load and save Jolokia options', () => {
    let options = jolokiaService.loadJolokiaStoredOptions()
    expect(options.maxDepth).toEqual(DEFAULT_MAX_DEPTH)
    expect(options.maxCollectionSize).toEqual(DEFAULT_MAX_COLLECTION_SIZE)

    jolokiaService.saveJolokiaStoredOptions({ maxDepth: 3, maxCollectionSize: 10000 })
    options = jolokiaService.loadJolokiaStoredOptions()
    expect(options.maxDepth).toEqual(3)
    expect(options.maxCollectionSize).toEqual(10000)
  })
})
