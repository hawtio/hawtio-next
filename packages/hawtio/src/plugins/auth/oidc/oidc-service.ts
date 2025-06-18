import { ResolveUser, userService } from '@hawtiosrc/auth/user-service'
import {
  configManager,
  hawtio,
  Logger,
  OidcAuthenticationMethod,
  TaskState
} from '@hawtiosrc/core'
import { jwtDecode } from 'jwt-decode'
import * as oidc from 'oauth4webapi'
import { AuthorizationResponseError, AuthorizationServer, Client, ClientAuth, OAuth2Error } from 'oauth4webapi'
import { getCookie } from '@hawtiosrc/util/https'

const pluginName = 'hawtio-oidc'

const log = Logger.get(pluginName)

const clientAuth: ClientAuth = (_as, client, parameters, _headers) => {
  parameters.set('client_id', client.client_id)
  return Promise.resolve()
}

/** OpenID Connect authentication method configuration - subtype of generic authentication type from configManager */
export type OidcConfig = OidcAuthenticationMethod & {
  /**
   * Authentication provider URL - should be a _base_ address for the endpoints and for `/.well-known/openid-configuration`
   * discovery.
   */
  provider: string | URL

  /**
   * Client ID to send to authorization endpoint
   */
  client_id: string

  /** Response mode according to https://openid.net/specs/oauth-v2-multiple-response-types-1_0.html#ResponseModes */
  response_mode: 'query' | 'fragment'

  /**
   * Scope parameter to choose - if not provided from the server side, should be determined at Hawtio side
   */
  scope: string

  /**
   * URL to redirect to after OIDC Authentication. Should be known (valid) at provider side
   */
  redirect_uri: string

  /** PKCE method for Authorization grant, according to https://datatracker.ietf.org/doc/html/rfc7636#section-4.3 */
  code_challenge_method: "S256" | "plain" | null

  /**
   * Prompt type according to https://openid.net/specs/openid-connect-core-1_0.html#AuthRequest
   * Supported values are from `prompt_values_supported` OIDC metadata.
   */
  prompt: 'none' | 'login' | 'consent' | 'select_account' | null

  /**
   * OpenID Connnect configuration obtained from [/.well-known/openid-configuration](https://openid.net/specs/openid-connect-discovery-1_0.html#ProviderConfigurationRequest)
   * endpoint.
   * See https://www.iana.org/assignments/oauth-parameters/oauth-parameters.xhtml#authorization-server-metadata
   *
   * If not available, We should hit the `/.well-known/openid-configuration` at {@link provider}.
   *
   * Type of this field is defined in `oauth4webapi` package
   */
  "openid-configuration"?: oidc.AuthorizationServer
}

export interface IOidcService {
  registerUserHooks(helpRegistration: () => void): void
}

type UserInfo = {
  user: string | null
  access_token: string | null | undefined
  refresh_token: string | null | undefined
  id_token: string | null | undefined
  at_exp: number
}

type AuthData = {
  // state
  st: string
  // code verifier
  cv: string
  // nonce
  n: string
  // window.location.href
  h: string
}

class OidcService implements IOidcService {
  // promises created during construction - should be already resolved in fetchUser and are related
  // only to configuration - not user/session fetching and checking
  private readonly config: Promise<OidcConfig | null>
  private readonly enabled: Promise<boolean>
  // OIDC metadata may be given together with configuration, but if it's null, it has to be fetched
  // from the client
  private readonly oidcMetadata: Promise<AuthorizationServer | null>

  // promise related to logged-in user. contains user name and tokens. This promise is resolved
  // after completing OAuth2 authorization flow or retrieving existing user using OIDC session
  // if there's no information about the user however we resolve this promise with null and we
  // don't start Authorization Flow - it's started only on user request
  private userInfo: Promise<UserInfo | null>

  // when user is logged in, the credentials are represented by the token (usually JWT), which has to
  // be sent with every HTTP request using built-in fetch, which we wrap
  private readonly originalFetch: (input: RequestInfo | URL, init?: RequestInit) => Promise<Response>

  constructor() {
    configManager.initItem("OIDC Configuration", TaskState.started, "config")
    this.config = fetch('auth/config/oidc')
        .then(response => response.ok && response.status == 200 ? response.json() : null)
        .then(json => {
          return json as OidcConfig
        })
        .catch(() => {
          configManager.initItem("OIDC Configuration", TaskState.skipped, "config")
          return null
        })

    this.enabled = this.isOidcEnabled()
    this.oidcMetadata = this.enabled
        .then(enabled => {
          if (enabled) {
            return this.fetchOidcMetadata().then(async (md) => {
              const c = await this.config
              // assign IDP details - noop if the details where fetched initially
              c!['openid-configuration'] = md!
              // prepare login function to be used by HawtioLogin UI
              c!.login = this.oidcLogin
              // add the information to augment template configuration in configManager
              configManager.configureAuthenticationMethod(c!).then(() => {
                configManager.initItem("OIDC Configuration", TaskState.finished, "config")
              })
              return md
            })
          } else {
            configManager.initItem("OIDC Configuration", TaskState.skipped, "config")
            return null
          }
        })

    // Initialize the state of OidcService based on what we have (in URI/storage), but
    // without initiating any OIDC Flow
    this.userInfo = this.initialize()

    this.originalFetch = fetch
  }

  /**
   * OIDC is enabled when configuration has `oidc` method and `provider` is specified
   * @private
   */
  private async isOidcEnabled(): Promise<boolean> {
    const cfg = await this.config
    return cfg?.method === 'oidc' && cfg?.provider != null
  }

  /**
   * Returns information about target IDP - either from initial configuration (prepared at server side by
   * `/auth/config/oidc` endpoint) or from OIDC metadata using additional request. Called only when OIDC
   * method is enabled
   * @private
   */
  private async fetchOidcMetadata(): Promise<AuthorizationServer | null> {
    let res = null
    const cfg = await this.config
    if (!cfg) {
      log.debug('OpenID authorization is disabled')
      return null
    }

    if (cfg['openid-configuration']) {
      // no need to contact .well-known/openid-configuration here - we have what we need from auth/config/oidc
      log.info('Using pre-fetched openid-configuration')
      return cfg['openid-configuration']
    } else {
      log.info('Fetching .well-known/openid-configuration')
      const cfgUrl = new URL(cfg!.provider)
      res = await oidc
        .discoveryRequest(cfgUrl, {
          [oidc.allowInsecureRequests]: true, // to also allow http requests (it's not "trust-all" flag)
        })
        .catch(e => {
          log.error('Failed OIDC discovery request', e)
        })
      if (!res || !res.ok) {
        return null
      }

      return await oidc.processDiscoveryResponse(cfgUrl, res)
    }
  }

  /**
   * OIDC initialization - we can check existing _state_ which is available in URI (after redirect from IdP)
   * and/or in localStorage (state kept in between cross origin requests)
   * @private
   */
  private async initialize(): Promise<UserInfo | null> {
    const enabled = await this.enabled
    // never null if enabled
    const config = await this.config
    const as = await this.oidcMetadata
    if (!config || !enabled || !as) {
      return null
    }

    // have we just been redirected with OAuth2 authorization response in query/fragment?
    let urlParams: URLSearchParams | null = null

    if (config!.response_mode === 'fragment') {
      if (window.location.hash && window.location.hash.length > 0) {
        urlParams = new URLSearchParams(window.location.hash.substring(1))
      }
    } else if (config!.response_mode === 'query') {
      if (window.location.search || window.location.search.length > 0) {
        urlParams = new URLSearchParams(window.location.search.substring(1))
      }
    }

    // parameters expected in successful and error cases
    const goodParamsRequired = ['code', 'state']
    const errorParamsRequired = ['error']

    if (as['authorization_response_iss_parameter_supported']) {
      // https://datatracker.ietf.org/doc/html/rfc9207#section-2.3
      goodParamsRequired.push('iss')
    }

    let oauthSuccess = urlParams != null
    let oauthError = false
    if (urlParams != null) {
      goodParamsRequired.forEach(p => {
        oauthSuccess &&= urlParams!.get(p) != null
      })
      errorParamsRequired.forEach(p => {
        oauthError ||= urlParams!.get(p) != null
      })
    }

    if (oauthError) {
      // we are already after redirect, but there was an OAuth2/OpenID problem
      const error: OAuth2Error = {
        error: urlParams?.get('error') as string,
        error_description: urlParams?.get('error_description') as string,
        error_uri: urlParams?.get('error_uri') as string,
      }
      log.error('OpenID Connect error', error)
      return null
    }

    if (!oauthSuccess) {
      // no user information in URI/webStorage, so OidcService stays at _inactive_ state, waiting to start
      // Authorization FLow on user demand
      return null
    }

    // there are proper OAuth2/OpenID params, so we can exchange them for access_token, refresh_token and id_token

    const client: Client = {
      client_id: config.client_id,
      token_endpoint_auth_method: 'none',
    }

    const state = urlParams!.get('state')
    let authResponse
    try {
      authResponse = oidc.validateAuthResponse(as, client, urlParams!, state!)
    } catch (e) {
      if (e instanceof AuthorizationResponseError) {
        log.error('OpenID Authorization error', e)
        return null
      }
    }

    log.info('Getting localStore data, because we have params', urlParams)
    const loginDataString = localStorage.getItem('hawtio-oidc-login')
    localStorage.removeItem('hawtio-oidc-login')
    if (!loginDataString) {
      log.warn("No local data, can't proceed with OpenID authorization grant")
      return null
    }
    const loginData = JSON.parse(loginDataString) as AuthData
    if (!loginData.cv || !loginData.st) {
      log.warn("Missing local data, can't proceed with OpenID authorization grant")
      return null
    }

    // send code to token endpoint to get tokens
    const res = await oidc
      .authorizationCodeGrantRequest(as, client, clientAuth, authResponse!, config.redirect_uri, loginData.cv, {
        [oidc.allowInsecureRequests]: true,
      })
      .catch(e => {
        log.warn('Problem accessing OpenID token endpoint', e)
        return null
      })
    if (!res) {
      log.warn('No authorization code grant response available')
      return null
    }

    // process response from token endpoint
    const tokenResponse = await oidc
      .processAuthorizationCodeResponse(as, client, res, {
        expectedNonce: loginData.n,
        maxAge: oidc.skipAuthTimeCheck,
      })
      .catch(e => {
        log.error('Problem processing OpenID token response', e)
        return null
      })
    if (!tokenResponse) {
      return null
    }

    const access_token = tokenResponse['access_token']
    const refresh_token = tokenResponse['refresh_token']
    const id_token = tokenResponse["id_token"]
    let at_exp: number = 0

    // we have to parse (though we shouldn't according to MS) access_token to get it's validity
    try {
      const access_token_decoded = jwtDecode(access_token)
      if (access_token_decoded['exp']) {
        at_exp = access_token_decoded['exp']
      } else {
        at_exp = 0
        log.warn('Access token doesn\'t contain "exp" information')
      }
    } catch (e) {
      log.warn('Problem determining access token validity', e)
    }

    const claims = oidc.getValidatedIdTokenClaims(tokenResponse)
    if (!claims) {
      log.warn('No ID token returned')
      return null
    }
    const user = (claims.name ?? claims.preferred_username ?? claims.sub) as string

    // clear the URL bar
    window.history.replaceState(null, '', loginData.h)

    this.setupFetch().then(() => true)

    // return information about the user to be processed by userService
    return {
      user,
      access_token,
      refresh_token,
      id_token,
      at_exp,
    }
  }

  /**
   * This is a method made available to `<HawtioLogin>` UI when user clicks "Login with OIDC" button
   */
  private oidcLogin = async (): Promise<boolean> => {
    const config = await this.config
    const as = await this.oidcMetadata
    if (!config || !as) {
      return false
    }

    // there are no query/fragment params in the URL, so we're logging for the first time
    const code_challenge_method = config!.code_challenge_method
    const code_verifier = oidc.generateRandomCodeVerifier()
    // TODO: this method calls crypto.subtle.digest('SHA-256', buf(codeVerifier)) so we need secure context
    if (!window.isSecureContext) {
      log.error("Can't perform OpenID Connect authentication in non-secure context")
      return false
    }

    const code_challenge = await oidc.calculatePKCECodeChallenge(code_verifier)

    const state = oidc.generateRandomState()
    const nonce = oidc.generateRandomNonce()

    // put some data to localStorage, so we can verify the OAuth2 response after redirect
    const verifyData = JSON.stringify({ st: state, cv: code_verifier, n: nonce, h: window.location.href })
    localStorage.setItem('hawtio-oidc-login', verifyData)

    log.info('Added to local storage', verifyData)

    const authorizationUrl = new URL(as!.authorization_endpoint!)
    authorizationUrl.searchParams.set('response_type', 'code')
    authorizationUrl.searchParams.set('response_mode', config.response_mode)
    authorizationUrl.searchParams.set('client_id', config.client_id)
    authorizationUrl.searchParams.set('redirect_uri', config.redirect_uri)
    const basePath = hawtio.getBasePath()
    const u = new URL(window.location.href)
    u.hash = ''
    let redirect = u.pathname
    if (basePath && redirect.startsWith(basePath)) {
      redirect = redirect.slice(basePath.length)
      if (redirect.startsWith('/')) {
        redirect = redirect.slice(1)
      }
    }
    // we have to use react-router to do client-redirect to connect/login if necessary
    // and we can't do full redirect to URL that's not configured on OIDC provider
    // and Entra ID can't use redirect_uri with wildcards... (Keycloak can do it)
    // sessionStorage.setItem('connect-login-redirect', redirect)
    authorizationUrl.searchParams.set('scope', config.scope)
    if (code_challenge_method) {
      authorizationUrl.searchParams.set('code_challenge_method', code_challenge_method)
      authorizationUrl.searchParams.set('code_challenge', code_challenge)
    }
    authorizationUrl.searchParams.set('state', state)
    authorizationUrl.searchParams.set('nonce', nonce)
    // do not take 'prompt' option, leave the default non-set version, as it works best with Hawtio and redirects

    log.info('Redirecting to ', authorizationUrl)

    // point of no return
    window.location.assign(authorizationUrl)
    // return unresolvable promise to wait for redirect
    return new Promise((_resolve, _reject) => {
      log.debug('Waiting for redirect')
    })
  }

  /**
   * Check whether the expiration date from access token means the token is expiring in less than 5 seconds.
   * @param at_exp
   * @private
   */
  private isTokenExpiring(at_exp: number): boolean {
    const now = Math.floor(Date.now() / 1000)
    // is expired, or will expire within 5 seconds?
    return at_exp - 5 < now
  }

  /**
   * Integrates this OidcService with UserService for user management.
   * @param helpRegistration
   */
  registerUserHooks(helpRegistration: () => void) {
    // user fetching hook - either we find logged in user (because we're at the stage where IdP redirects
    // to Hawtio with code/state in fragment URI or we don't find the user.
    // we never initiate Authorization FLow without user interaction
    // note - finding proper state/session_state/iss/code after redirect may still cause issues when
    // exchanging code for token (timeouts, errors, session/cookie issues, ...). In this case
    // fetchUser should actually fetch the user, but with some error information
    const fetchUser = async (resolveUser: ResolveUser, proceed?: () => boolean) => {
      if (proceed && !proceed()) {
        return false
      }

      const userInfo = await this.userInfo
      if (!userInfo) {
        return false
      }
      resolveUser({ username: userInfo.user!, isLogin: true, loginMethod: "oidc" })
      userService.setToken(userInfo.access_token!)

      // only now register help tab for OIDC
      helpRegistration()

      return true
    }
    userService.addFetchUserHook('oidc', fetchUser)

    // logout hook which implements
    // https://openid.net/specs/openid-connect-rpinitiated-1_0.html
    const logout = async () => {
      const md = await this.oidcMetadata
      if (md?.end_session_endpoint) {
        // for Keycloak, with id_token_hint we don't see logout consent
        // const user = await this.userInfo
        // window.location.replace(`${md?.end_session_endpoint}?post_logout_redirect_uri=${document.baseURI}&id_token_hint=${user!.id_token}`)
        // for Keycloak, with client_id passed here, we're logged out automatically and get redirected to Hawtio
        const c = await this.config
        window.location.replace(`${md?.end_session_endpoint}?post_logout_redirect_uri=${document.baseURI}&client_id=${c!.client_id}`)
        return true
      }
      return false
    }
    userService.addLogoutHook('oidc', logout)
  }

  private async updateToken(success: (userInfo: UserInfo) => void, failure?: () => void) {
    const userInfo = await this.userInfo
    if (!userInfo) {
      return
    }
    if (userInfo.refresh_token) {
      const config = await this.config
      const enabled = await this.enabled
      const as = await this.oidcMetadata
      if (!config || !enabled || !as) {
        return
      }

      const client: Client = {
        client_id: config.client_id,
        token_endpoint_auth_method: 'none',
      }

      // use the original fetch - we don't want stack overflow
      const options: oidc.TokenEndpointRequestOptions = {
        [oidc.customFetch]: this.originalFetch,
        [oidc.allowInsecureRequests]: true,
      }
      const res = await oidc
        .refreshTokenGrantRequest(as, client, clientAuth, userInfo.refresh_token, options)
        .catch(e => {
          log.error('Problem refreshing token', e)
          if (failure) {
            failure()
          }
        })
      if (!res) {
        return
      }
      const refreshResponse = await oidc.processRefreshTokenResponse(as, client, res).catch(e => {
        log.error('Problem processing refresh token response', e)
      })
      if (!refreshResponse) {
        return
      }
      userInfo.access_token = refreshResponse['access_token'] as string
      userInfo.refresh_token = refreshResponse['refresh_token'] as string
      const access_token_decoded = jwtDecode(userInfo.access_token)
      if (access_token_decoded['exp']) {
        userInfo.at_exp = access_token_decoded['exp']
      } else {
        userInfo.at_exp = 0
        log.warn('Access token doesn\'t contain "exp" information')
      }

      this.userInfo = Promise.resolve(userInfo)
      success(userInfo)
    } else {
      log.error('No refresh token available')
    }
  }

  /**
   * Replace global `fetch` function with a delegated call that handles authorization for remote Jolokia agents
   * and target agent that may run as proxy (to remote Jolokia agent).
   * `fetch` wrapper will also refresh access token if needed.
   * @private
   */
  private async setupFetch() {
    let userInfo = await this.userInfo
    if (!userInfo) {
      return
    }

    window.fetch = async (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
      const logPrefix = 'Fetch -'

      if (userInfo && (!userInfo.access_token || this.isTokenExpiring(userInfo.at_exp))) {
        log.debug(logPrefix, 'Refreshing access token')
        return new Promise((resolve, reject) => {
          this.updateToken(
            _userInfo => {
              if (_userInfo) {
                userInfo = _userInfo
                log.debug(logPrefix, 'OIDC token refreshed. Set new value to userService')
                userService.setToken(userInfo!.access_token!)
              }
              log.debug(logPrefix, 'Re-sending request after successfully updating OIDC token:', input)
              resolve(fetch(input, init))
            },
            () => {
              log.debug(logPrefix, 'Logging out due to token update failed')
              userService.logout()
              reject()
            },
          )
        })
      }

      init = { ...init }

      init.headers = {
        ...init.headers,
        Authorization: `Bearer ${userInfo!.access_token}`,
      }

      // For CSRF protection with Spring Security
      const token = getCookie('XSRF-TOKEN')
      if (token) {
        init.headers = {
          ...init.headers,
          'X-XSRF-TOKEN': token,
        }
      }

      return this.originalFetch(input, init)
    }
  }
}

export const oidcService = new OidcService()
