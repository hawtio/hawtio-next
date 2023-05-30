import { Logger } from '@hawtiosrc/core'

export const pluginName = 'hawtio-auth-keycloak'

export const log = Logger.get(pluginName)

export const PATH_KEYCLOAK_ENABLED = 'keycloak/enabled'
export const PATH_KEYCLOAK_CLIENT_CONFIG = 'keycloak/client-config'
export const PATH_KEYCLOAK_VALIDATE = 'keycloak/validate-subject-matches'
