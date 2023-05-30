import fetchMock from 'jest-fetch-mock'
import { __testing__, keycloakService } from './keycloak-service'

jest.mock('keycloak-js', () => {
  // mock keycloak
  return jest.fn().mockImplementation(() => {
    return {
      init: jest.fn(() => true), // authenticated = true
      loadUserProfile: jest.fn(() => ({})), // userProfile = {}
    }
  })
})

describe('KeycloakService', () => {
  beforeEach(() => {
    jest.resetModules()
    fetchMock.resetMocks()
  })

  test('keycloakService exists', () => {
    expect(keycloakService).not.toBeNull()
  })

  test('Keycloak is disabled', async () => {
    // response for fetching /keycloak/enabled
    fetchMock.mockResponse('   false   \n')

    const keycloakService = new __testing__.KeycloakService()
    await expect(keycloakService.isKeycloakEnabled()).resolves.toEqual(false)
  })

  test('Keycloak is enabled', async () => {
    fetchMock
      // response for fetching /keycloak/enabled
      .once('   true   \n')
      // response for fetching /keycloak/client-config
      .once(
        JSON.stringify({
          url: 'http://localhost:18080/',
          realm: 'hawtio-demo',
          clientId: 'hawtio-client',
          jaas: false,
        }),
      )

    const keycloakService = new __testing__.KeycloakService()
    await expect(keycloakService.isKeycloakEnabled()).resolves.toEqual(true)
  })

  test('validateSubjectMatches', async () => {
    const keycloakService = new __testing__.KeycloakService()

    // responses for fetching /keycloak/validate-subject-matches
    fetchMock.once('   true   \n').once('   false   \n').mockReject(new Error('Test error'))

    await expect(keycloakService.validateSubjectMatches('test-user')).resolves.toEqual(true)
    await expect(keycloakService.validateSubjectMatches('test-user')).resolves.toEqual(false)
    await expect(keycloakService.validateSubjectMatches('test-user')).resolves.toEqual(false)
  })
})
