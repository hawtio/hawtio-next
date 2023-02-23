import fetchMock from 'jest-fetch-mock'
import { configManager, __testing__ } from './config-manager'

describe('ConfigManager', () => {
  beforeEach(() => {
    fetchMock.resetMocks()
  })

  test('configManager exists', () => {
    expect(configManager).not.toBeNull()
  })

  test('hawtconfig.json is loaded', async () => {
    // response for fetching hawtconfig.json
    fetchMock.mockResponse(
      JSON.stringify({
        branding: {
          appName: 'Test App',
        },
        online: {
          projectSelector: 'environment=dev,networkzone=internal',
        },
      }),
    )

    const configManager = new __testing__.ConfigManager()
    const config = await configManager.getHawtconfig()
    expect(config.branding?.appName).toEqual('Test App')
    expect(config.online?.projectSelector).toEqual('environment=dev,networkzone=internal')
  })

  test('branding is applied', async () => {
    document.head.innerHTML = `
      <title>Hawtio</title>
      <link id="favicon" href="favicon.ico">
      <link id="branding" href="">
    `
    // response for fetching hawtconfig.json
    fetchMock.mockResponse(
      JSON.stringify({
        branding: {
          appName: 'Test App',
          css: 'test.css',
          favicon: 'test.ico',
        },
      }),
    )

    const configManager = new __testing__.ConfigManager()
    const brandingApplied = await configManager.isBrandingApplied()
    expect(brandingApplied).toBe(true)
    const head = document.head.innerHTML
    expect(head).toContain('<title>Test App</title>')
    expect(head).toContain('<link id="favicon" href="test.ico">')
    expect(head).toContain('<link id="branding" href="test.css">')
  })

  test('branding is not applied', async () => {
    document.head.innerHTML = `
      <title>Hawtio</title>
      <link id="favicon" href="favicon.ico">
      <link id="branding" href="">
    `
    // response for fetching hawtconfig.json
    fetchMock.mockResponse(JSON.stringify({}))

    const configManager = new __testing__.ConfigManager()
    const brandingApplied = await configManager.isBrandingApplied()
    expect(brandingApplied).toBe(false)
    const head = document.head.innerHTML
    expect(head).toContain('<title>Hawtio</title>')
    expect(head).toContain('<link id="favicon" href="favicon.ico">')
    expect(head).toContain('<link id="branding" href="">')
  })

  test('isRouteEnabled returns false/true for disabled/non-disabled routes', async () => {
    // response for fetching hawtconfig.json
    fetchMock.mockResponse(
      JSON.stringify({
        disabledRoutes: ['route1'],
      }),
    )

    const configManager = new __testing__.ConfigManager()
    await expect(configManager.isRouteEnabled('route1')).resolves.toBe(false)
    await expect(configManager.isRouteEnabled('route2')).resolves.toBe(true)
  })

  test('isRouteEnabled returns true when disabledRoutes property is undefined', async () => {
    // response for fetching hawtconfig.json
    fetchMock.mockResponse('{}')

    const configManager = new __testing__.ConfigManager()
    const routeEnabled = await configManager.isRouteEnabled('route1')
    expect(routeEnabled).toEqual(true)
  })

  test('filters enabled plugins', async () => {
    // response for fetching hawtconfig.json
    fetchMock.mockResponse(
      JSON.stringify({
        disabledRoutes: ['route1', 'route3'],
      }),
    )
    const plugins = [...Array(5).keys()].map(i => ({
      id: `route${i}`,
      title: `Route ${i}`,
      path: `route${i}`,
      component: () => null,
      isActive: () => Promise.resolve(true),
    }))

    const configManager = new __testing__.ConfigManager()
    const enabledPlugins = await configManager.filterEnabledPlugins(plugins)
    expect(enabledPlugins.map(p => p.path)).toEqual(['route0', 'route2', 'route4'])
  })

  test('loads and adds product info', async () => {
    // response for fetching hawtconfig.json
    fetchMock.mockResponse(
      JSON.stringify({
        about: {
          title: 'Test App',
          description: 'This is a test.',
          imgSrc: 'test-logo.svg',
          productInfo: [
            {
              name: 'ABC',
              value: '1.2.3',
            },
            {
              name: 'XYZ',
              value: '7.8.9',
            },
          ],
          copyright: '© Hawtio project',
        },
      }),
    )

    const configManager = new __testing__.ConfigManager()
    let config = await configManager.getHawtconfig()
    expect(config.about?.title).toEqual('Test App')
    expect(config.about?.description).toEqual('This is a test.')
    expect(config.about?.imgSrc).toEqual('test-logo.svg')
    expect(config.about?.productInfo).toHaveLength(2)
    let product1 = config.about?.productInfo?.[0]
    expect(product1?.name).toEqual('ABC')
    expect(product1?.value).toEqual('1.2.3')
    let product2 = config.about?.productInfo?.[1]
    expect(product2?.name).toEqual('XYZ')
    expect(product2?.value).toEqual('7.8.9')
    expect(config.about?.copyright).toEqual('© Hawtio project')

    configManager.addProductInfo('Hawtio React', '1.0.0')
    config = await configManager.getHawtconfig()
    expect(config.about?.productInfo).toHaveLength(3)
    product1 = config.about?.productInfo?.[0]
    expect(product1?.name).toEqual('ABC')
    expect(product1?.value).toEqual('1.2.3')
    product2 = config.about?.productInfo?.[1]
    expect(product2?.name).toEqual('XYZ')
    expect(product2?.value).toEqual('7.8.9')
    const product3 = config.about?.productInfo?.[2]
    expect(product3?.name).toEqual('Hawtio React')
    expect(product3?.value).toEqual('1.0.0')
  })
})
