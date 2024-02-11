import { ResolveUser, userService } from "@hawtiosrc/auth/user-service"
import { Logger } from "@hawtiosrc/core"

// import { jwtDecode } from "jwt-decode"
import { AuthorizationServer, Client, OAuth2Error } from "oauth4webapi"
import * as oidc from "oauth4webapi"
import { fetchPath } from "@hawtiosrc/util/fetch"

const pluginName = "hawtio-oidc"
const log = Logger.get(pluginName)

export type OidcConfig = {

  /** Provider type. If "null", then OIDC is not enabled */
  method: "oidc" | null

  /** Provider URL. Should be the URL without ".well-known/openid-configuration" */
  provider: string

  /** Unique Client ID for OIDC provider */
  client_id: string

  /** Response mode according to https://openid.net/specs/oauth-v2-multiple-response-types-1_0.html#ResponseModes */
  response_mode: "query" | "fragment"

  /** Scope used to obtain relevant access token from OIDC provider */
  scope: string

  /** Redirect URI passed with OIDC authorization request */
  redirect_uri: string

  /** PKCE method for Authorization grant, according to https://datatracker.ietf.org/doc/html/rfc7636#section-4.3 */
  code_challenge_method: "S256" | "plain" | null

  /** Prompt type according to https://openid.net/specs/openid-connect-core-1_0.html#AuthRequest */
  prompt: "none" | "login" | "consent" | "select_account" | null
}

export interface IOidcService {
  registerUserHooks(): void
}

export class OidcService implements IOidcService {
  private readonly config: Promise<OidcConfig | null>

  private readonly enabled: Promise<boolean>
  private readonly oidcMetadata: Promise<AuthorizationServer | null>
  access_token: string | null = null

  constructor() {
    this.config = fetchPath<OidcConfig | null>("auth/config", {
      success: (data: string) => {
        return JSON.parse(data)
      },
      error: () => null
    })

    this.enabled = this.isOidcEnabled()
    this.oidcMetadata = this.fetchOidcMetadata()
  }

  private async isOidcEnabled(): Promise<boolean> {
    const cfg = await this.config
    return cfg?.method === "oidc"
  }

  private async fetchOidcMetadata(): Promise<AuthorizationServer | null> {
    let res = null
    const enabled = await this.enabled
    const cfg = await this.config
    if (!enabled || !cfg) {
      log.debug("OpenID authorization is disabled")
      return null
    }

    const cfgUrl = new URL(cfg!.provider)
    res = await oidc.discoveryRequest(cfgUrl).catch(e => {
      log.error("Failed OIDC discovery request", e)
    })
    if (!res || !res.ok) {
      return null
    }

    return await oidc.processDiscoveryResponse(cfgUrl, res)
  }

  registerUserHooks() {
    const fetchUser = async (resolveUser: ResolveUser, signal: AbortSignal | null, proceed: (() => boolean) | null) => {
      if (proceed && !proceed()) {
        return false
      }
      const config = await this.config
      const enabled = await this.enabled
      const as = await this.oidcMetadata
      if (!config || !enabled || !as || (proceed && !proceed())) {
        return false
      }

      // we have all the metadata to try to log in to OpenID provider.

      // have we just been redirected with OAuth2 authirization response in query/fragment?
      let urlParams: URLSearchParams | null = null

      if (config!.response_mode === "fragment") {
        if (window.location.hash && window.location.hash.length > 0) {
          urlParams = new URLSearchParams(window.location.hash.substring(1))
        }
      } else if (config!.response_mode === "query") {
        if (window.location.search || window.location.search.length > 0) {
          urlParams = new URLSearchParams(window.location.search.substring(1))
        }
      }

      const goodParamsRequired = [ "code", "state" ]
      const errorParamsRequired = [ "error" ]

      if (as["authorization_response_iss_parameter_supported"]) {
        // https://datatracker.ietf.org/doc/html/rfc9207#section-2.3
        goodParamsRequired.push("iss")
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
          error: urlParams?.get("error") as string,
          error_description: urlParams?.get("error_description") as string,
          error_uri: urlParams?.get("error_uri") as string
        }
        log.error("OpenID Connect error", error)
        return false
      }

      if (!oauthSuccess) {
        // there are no query/fragment params in the URL, so we're logging for the first time
        const code_challenge_method = config!.code_challenge_method
        const code_verifier = oidc.generateRandomCodeVerifier()
        const code_challenge = await oidc.calculatePKCECodeChallenge(code_verifier)
        if (proceed && !proceed()) {
          return false
        }

        const state = oidc.generateRandomState()
        const nonce = oidc.generateRandomNonce()

        // put some data to localStorage, so we can verify the OAuth2 response after redirect
        localStorage.removeItem("hawtio-oidc-login")
        localStorage.setItem("hawtio-oidc-login", JSON.stringify({
          "st": state,
          "cv": code_verifier,
          "n": nonce,
          "h": window.location.href
        }))
        log.info("Added to local storage", localStorage.getItem("hawtio-oidc-login"))

        const authorizationUrl = new URL(as!.authorization_endpoint!)
        authorizationUrl.searchParams.set('response_type', 'code')
        authorizationUrl.searchParams.set('response_mode', config.response_mode)
        authorizationUrl.searchParams.set('client_id', config.client_id)
        authorizationUrl.searchParams.set('redirect_uri', config.redirect_uri)
        authorizationUrl.searchParams.set('scope', config.scope)
        if (code_challenge_method) {
          authorizationUrl.searchParams.set('code_challenge_method', code_challenge_method)
          authorizationUrl.searchParams.set('code_challenge', code_challenge)
        }
        authorizationUrl.searchParams.set('state', state)
        authorizationUrl.searchParams.set('nonce', nonce)
        // authorizationUrl.searchParams.set('login_hint', 'hawtio-viewer@fuseqe.onmicrosoft.com')
        // authorizationUrl.searchParams.set('hsu', '1')
        if (config.prompt) {
          authorizationUrl.searchParams.set('prompt', config.prompt)
        }

        log.info("Redirecting to ", authorizationUrl)

        // point of no return
        window.location.assign(authorizationUrl)
        // resolve as "pending" user, to avoid flickering
        resolveUser({ username: "", isLogin: true, isLoading: true })
        return true
      }

      const client: Client = {
        client_id: config.client_id,
        token_endpoint_auth_method: "none"
      }

      // there are proper OAuth2/OpenID params, so we can exchange them for access_token, refresh_token and id_token
      const state = urlParams!.get("state")
      const authResponse = oidc.validateAuthResponse(as, client, urlParams!, state!)

      if (oidc.isOAuth2Error(authResponse)) {
        log.error("OpenID Authorization error", authResponse)
        return false
      }

      log.info("Getting localStore data, because we have params", urlParams)
      const loginDataString = localStorage.getItem("hawtio-oidc-login")
      // localStorage.removeItem("hawtio-oidc-login")
      if (!loginDataString) {
        log.warn("No local data, can't proceed with OpenID authorization grant")
        return false
      }
      const loginData = JSON.parse(loginDataString)
      if (!loginData.cv || !loginData.st) {
        log.warn("Missing local data, can't proceed with OpenID authorization grant")
        return false
      }

      const options: { signal?: AbortSignal } = {}
      if (signal) {
        options.signal = signal
      }
      const res = await oidc.authorizationCodeGrantRequest(as, client, authResponse, config.redirect_uri, loginData.cv, options)
          .catch(e => {
            log.warn("Problem accessing OpenID token endpoint", e)
            return null
          })
      if (!res) {
        return false
      }

      const tokenResponse = await oidc.processAuthorizationCodeOpenIDResponse(as, client, res, loginData.n, oidc.skipAuthTimeCheck)
          .catch(e => {
            log.warn("Problem processing OpenID token response", e)
            return null
          })
      if (!tokenResponse) {
        return false
      }
      if (oidc.isOAuth2Error(tokenResponse)) {
        log.error("OpenID Token error", tokenResponse)
        return false
      }

      this.access_token = tokenResponse["access_token"]
      // const refresh_token = tokenResponse["refresh_token"]
      // const id_token = tokenResponse["id_token"]

      // we have to parse (though we shouldn't according to MS) access_token to get it's validity
      // try {
      //   const access_token_decoded = jwtDecode(access_token)
      //   const at_exp = access_token_decoded["exp"]
      // } catch (e) {
      //   log.debug("Problem determining access token validity", e)
      // }

      const claims = oidc.getValidatedIdTokenClaims(tokenResponse)
      const user = (claims.preferred_username ?? claims.sub) as string

      // clear the URL bar
      window.history.replaceState(null, "", loginData.h)

      resolveUser({ username: user, isLogin: true, isLoading: false })
      userService.setToken(this.access_token)
      return true
    }
    userService.addFetchUserHook("oidc", fetchUser)

    const logout = async () => {
      const md = await this.oidcMetadata
      if (md?.end_session_endpoint) {
        window.location.replace(md?.end_session_endpoint)
        return true
      }
      return false
    }
    userService.addLogoutHook("oidc", logout)
  }
}

export const oidcService = new OidcService()
