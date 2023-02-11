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
    const config = await configManager.getConfig()
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
})
