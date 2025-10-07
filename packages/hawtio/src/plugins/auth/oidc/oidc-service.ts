import { type ResolveUser, type UserAuthResult, userService } from '@hawtiosrc/auth/user-service'
import {
  AuthenticationResult,
  configManager,
  hawtio,
  Logger,
  OidcAuthenticationMethod,
  TaskState,
} from '@hawtiosrc/core'
import { jwtDecode } from 'jwt-decode'
import * as oidc from 'oauth4webapi'
import { AuthorizationResponseError, AuthorizationServer, Client, ClientAuth, OAuth2Error } from 'oauth4webapi'
import { getCookie } from '@hawtiosrc/util/https'

const pluginName = 'hawtio-oidc'
const AUTH_METHOD = 'oidc'

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
  code_challenge_method: 'S256' | 'plain' | null

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
  'openid-configuration'?: oidc.AuthorizationServer
}

export interface IOidcService {
  registerUserHooks(helpRegistration: () => void): void
}

/** Full information about authorization attempt */
type UserInfo = {
  user?: string
  access_token?: string
  refresh_token?: string
  id_token?: string
  at_exp?: number
  error?: string
  error_description?: string
  error_uri?: string
}

/** Information stored in localStorage during Authorization Flow */
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
  // promises created during construction
  // configuration from Hawtio backend - should include provider URL
  private readonly config: Promise<OidcConfig | null>
  // OIDC plugin is enabled when there's provider URL in the config - may not be reachable though
  private readonly enabled: Promise<boolean>
  // OIDC metadata may come with config. When not provided we have to get it from .well-known/openid-configuration
  // if we can't access it during initialization, we have to try on login
  private oidcMetadata: Promise<AuthorizationServer | null>

  // promise related to logged-in user. contains user name and tokens. This promise is resolved
  // after completing OAuth2 authorization flow or retrieving existing user using OIDC session
  // if there's no information about the user however we resolve this promise with null and we
  // don't start Authorization Flow - it's started only on user request
  private userInfo: Promise<UserInfo | null>

  // when user is logged in, the credentials are represented by the token (usually JWT), which has to
  // be sent with every HTTP request using built-in fetch, which we wrap
  private readonly originalFetch: (input: RequestInfo | URL, init?: RequestInit) => Promise<Response>

  constructor() {
    configManager.initItem('OIDC Configuration', TaskState.started, 'config')
    this.config = fetch('auth/config/oidc')
      .then(response => (response.ok && response.status == 200 ? response.json() : null))
      .then(json => {
        return json as OidcConfig
      })
      .catch(() => {
        configManager.initItem('OIDC Configuration', TaskState.skipped, 'config')
        return null
      })

    this.enabled = this.isOidcEnabled()
    this.oidcMetadata = this.enabled.then(enabled => {
      if (enabled) {
        return this.fetchOidcMetadata().then(md => {
          return this.processOidcMetadata(md, true)
        })
      } else {
        configManager.initItem('OIDC Configuration', TaskState.skipped, 'config')
        return null
      }
    })

    // Initialize the state of OidcService based on what we have (in URI/storage), but
    // without initiating any OIDC Flow
    this.userInfo = this.initialize()

    this.originalFetch = fetch
    this.originalFetch = this.originalFetch.bind(window)
  }

  /**
   * This should happen during initialization, but when OIDC is enabled and we can't fetch OIDC metadata initially,
   * we'll be trying to do it during login until we get the metadata.
   * @param md
   * @param initial
   * @private
   */
  private async processOidcMetadata(
    md: AuthorizationServer | null,
    initial: boolean = false,
  ): Promise<AuthorizationServer | null> {
    const c = await this.config
    // if OIDC is enabled we'll have all the config except maybe "openid-configuration"
    // prepare login function to be used by HawtioLogin UI
    if (md) {
      // assign IDP details - noop if the details where fetched initially
      c!['openid-configuration'] = md!
    }
    if (initial) {
      c!.login = this.oidcLogin
      // add the information to augment template configuration in configManager
      // we don't need "openid-configuration" here
      // and we have to finish the "OIDC Configuration" init item
      configManager.configureAuthenticationMethod(c!).then(() => {
        configManager.initItem('OIDC Configuration', TaskState.finished, 'config')
      })
    }

    return md
  }

  /**
   * OIDC is enabled when configuration has `oidc` method and `provider` is specified
   * @private
   */
  private async isOidcEnabled(): Promise<boolean> {
    const cfg = await this.config
    return cfg?.method === AUTH_METHOD && cfg?.provider != null
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
      return error
    }

    if (!oauthSuccess /* && !oauthError */) {
      // no user information in URI/webStorage, so OidcService stays at _inactive_ state, waiting to start
      // Authorization FLow on user demand

      // however to let user refresh the browser we may have to perform silent login - but only when
      // there's no error and there's no state in URI
      const ts = localStorage.getItem('core.auth.oidc')
      localStorage.removeItem('core.auth.oidc')
      if (ts) {
        const exp_at = parseInt(ts)
        const now = Date.now()
        if (!isNaN(exp_at) && now < exp_at * 1000) {
          // we're still before access_token expiration time, so we can do the silent login
          // to not show <HawtioInitialization> twice, we'll set another flag
          localStorage.setItem('core.auth.silentLogin', '1')
          this.oidcLogin(true)
        }
      }

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
        return { error: e.message }
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
      const msg = 'No authorization code grant response available'
      log.warn(msg)
      return { error: msg }
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
      return { error: 'Problem processing OpenID token response' }
    }

    const access_token = tokenResponse['access_token']
    const refresh_token = tokenResponse['refresh_token']
    const id_token = tokenResponse['id_token']
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
      const msg = 'No ID token returned'
      log.warn(msg)
      return { error: msg }
    }
    const user = (claims.name ?? claims.preferred_username ?? claims.sub) as string

    // clear the URL bar getting back to client-side URI we had before
    window.history.replaceState(null, '', loginData.h)

    // mark successful authentication method. When user refreshes the browser we have to attempt
    // authorization flow with prompt=none to do "silent login"
    // Keycloak.js uses check_session_iframe parameter from OIDC metadata to manage hidden iframe
    // to do the silent login, but with modern browsers, tracking prevention and 3rd party cookie policies
    // we can't actually rely on it.
    // instead we'll simply add a flag to be checked on refresh and to be cleared on logout
    // we'll use access_token expiration time as the hint - if user refreshes before the expiration
    // we start silent login
    localStorage.setItem('core.auth.oidc', `${at_exp}`)

    this.setupFetch()

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
   * This is a method made available to `<HawtioLogin>` UI when user clicks "Login with OIDC" button.
   *
   * @param silent whether to start _silen_ (`prompt=none`) Authorization Flow
   * @return `false` (a promise resolving to `false`) if the login process can't proceed - login screen should
   * display generic error
   */
  private oidcLogin = async (silent = false): Promise<AuthenticationResult> => {
    const config = await this.config
    if (!config) {
      return AuthenticationResult.configuration_error
    }

    let as = await this.oidcMetadata
    if (!as) {
      // we have the config, OIDC is enabled, but somehow we didn't get the metadata - let's try it now
      this.oidcMetadata = this.fetchOidcMetadata().then(md => {
        return this.processOidcMetadata(md, false)
      })
      as = await this.oidcMetadata
      if (!as) {
        // we tried, but we still don't have the metadata - we can only show user login error
        return AuthenticationResult.configuration_error
      }
    }

    // at this stage we can log in, but still - IdP may be down, so it'd be nice to check its reachable with
    // fetch() instead of getting "Unable to connect" displayed by browser after window.location.assign/replace
    const available = await this.checkAvailability()
    if (!available) {
      return AuthenticationResult.connect_error
    }

    // there are no query/fragment params in the URL, so we're logging for the first time
    const code_challenge_method = config!.code_challenge_method
    const code_verifier = oidc.generateRandomCodeVerifier()
    // TODO: this method calls crypto.subtle.digest('SHA-256', buf(codeVerifier)) so we need secure context
    if (!window.isSecureContext) {
      log.error("Can't perform OpenID Connect authentication in non-secure context")
      return AuthenticationResult.security_context_error
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
    // TODO: sessionStorage.setItem('connect-login-redirect', redirect)
    authorizationUrl.searchParams.set('scope', config.scope)
    if (code_challenge_method) {
      authorizationUrl.searchParams.set('code_challenge_method', code_challenge_method)
      authorizationUrl.searchParams.set('code_challenge', code_challenge)
    }
    authorizationUrl.searchParams.set('state', state)
    authorizationUrl.searchParams.set('nonce', nonce)
    // do not take 'prompt' option from configuration,
    // leave the default non-set version, as it works best with Hawtio and redirects
    // but use 'none' for explicit silent login
    if (silent) {
      authorizationUrl.searchParams.set('prompt', 'none')
    }

    log.info('Redirecting to ', authorizationUrl)

    // point of no return
    // use "location.replace" to prevent user from going back in history
    window.location.replace(authorizationUrl)
    // return unresolvable promise to wait for redirect
    return new Promise((_resolve, _reject) => {
      log.debug('Waiting for redirect')
    })
  }

  /**
   * Attempt to communicate with IdP before login/logout using window.location.assign/replace
   * @private
   */
  private async checkAvailability(): Promise<boolean> {
    try {
      const cfg = await this.config
      if (cfg) {
        const provider = cfg!.provider
        return this.originalFetch
          .bind(window)(provider)
          .then(_r => true)
          .catch(_e => false)
      }
      return false
    } catch {
      return false
    }
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
    const fetchUser = async (resolveUser: ResolveUser, proceed?: () => boolean): Promise<UserAuthResult> => {
      if (proceed && !proceed()) {
        return { isIgnore: true, isError: false, loginMethod: AUTH_METHOD }
      }

      const userInfo = await this.userInfo
      if (!userInfo) {
        // no login attempt
        return { isIgnore: true, isError: false, loginMethod: AUTH_METHOD }
      }
      // silent login finished - whether it's successful or not
      localStorage.removeItem('core.auth.silentLogin')

      if (!userInfo.error) {
        // successful login attempt
        resolveUser({ username: userInfo.user!, isLogin: true, loginMethod: AUTH_METHOD })
      } else {
        // OIDC error
        const errorMessage = '"oidc" plugin error: ' + (userInfo.error_description ?? userInfo.error)
        return { isIgnore: false, isError: true, errorMessage: errorMessage, loginMethod: AUTH_METHOD }
      }
      userService.setToken(userInfo.access_token!)

      // only now register help tab for OIDC
      helpRegistration()

      return { isIgnore: false, isError: false, loginMethod: AUTH_METHOD }
    }
    userService.addFetchUserHook(AUTH_METHOD, fetchUser)

    // logout hook which implements
    // https://openid.net/specs/openid-connect-rpinitiated-1_0.html
    const logout = async () => {
      const md = await this.oidcMetadata
      if (md?.end_session_endpoint) {
        const available = await this.checkAvailability()
        if (!available) {
          return false
        }
        // no more silent login allowed on refresh
        localStorage.removeItem('core.auth.oidc')
        // for Keycloak, with id_token_hint we don't see logout consent
        // const user = await this.userInfo
        // window.location.assign(`${md?.end_session_endpoint}?post_logout_redirect_uri=${document.baseURI}&id_token_hint=${user!.id_token}`)
        // for Keycloak, with client_id passed here, we're logged out automatically and get redirected to Hawtio
        const c = await this.config
        // here we can't verify connection to IdP - we'll simply get browser error. Nothing we can do at this stage
        // use "location.assign" to let user browse back
        window.location.assign(
          `${md?.end_session_endpoint}?post_logout_redirect_uri=${document.baseURI}&client_id=${c!.client_id}`,
        )
        return true
      }
      return false
    }
    userService.addLogoutHook(AUTH_METHOD, logout)
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
    if (!userInfo || userInfo.error || userInfo.error_description) {
      return
    }

    window.fetch = async (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
      const logPrefix = 'Fetch -'

      if (userInfo && (!userInfo.access_token || this.isTokenExpiring(userInfo.at_exp!))) {
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
