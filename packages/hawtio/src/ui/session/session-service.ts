import { fetchPath } from '@hawtiosrc/util/fetch'
import { log } from './globals'

type SessionConfig = {
  req?: number
  res?: number
  now?: number
  timeout: number
}

class SessionService {
  private lastActivity = 0
  private lastRefresh = 0
  // flag set to true by all user interaction. If set, a periodic "refresh" request is sent and the flag is cleared
  // if the flag is not set again with another user interaction, the refreshes stop and session may expire at server side
  private keepAlive = true
  // when this flag is set, SessionMonitor component should be informed. it'll reset its state then
  private resetTimer = false
  // a flag which may be used to disable "userActivity()" handler
  private refresh = true

  private sessionConfig: SessionConfig | null = null
  private sessionTimeout = -1

  /**
   * Calling this method means that user performed some action and is expecting to keep the (server-side) session
   * alive.
   * We can use this method in various places depending on needs.
   * Initially I used it in useEffect(..., [location]), where "location" was from useLocation hook (react-router).
   * But this didn't work when clicking on JMX tree nodes.
   */
  userActivity() {
    if (!this.refresh) {
      return
    }

    this.keepAlive = true

    const now = Date.now()
    if (now - this.lastRefresh > 5000) {
      // last ping was sent more than 5 seconds ago - better not wait any longer
      // we've refreshed the session earlier than scheduled refresh interval. To prevent session expiration in
      // case a click happens just before the end date, we'll refresh now
      this.updateSession()
      // indicate that the session was updated outside of normal 5-seconds cycle
      this.resetTimer = true
    }
    this.lastActivity = Date.now()
  }

  /**
   * This method should be called when there's a need to ping server, so the (server-side) session is kept alive.
   * Normally this should not be called on each call to userActivity().
   */
  updateSession(): boolean {
    // SessionMonitor calls this method every 5 seconds, but if there was no user interaction, we don't do anything
    if (!this.keepAlive || this.sessionTimeout <= 0) {
      return false
    }
    // no need to ping server otherwise
    fetchPath('refresh', {
      success: () => true,
      error: () => false,
    }).catch(_ => false)

    // clear the flag, so next refresh happens only after user clicks anything
    this.keepAlive = false
    this.lastRefresh = Date.now()

    return true
  }

  /**
   * Indicates whether given "time before session end" means that the session is expiring (to display alert)
   * @param time
   */
  sessionEnding(time: number): boolean {
    return time >= 0 && time < 21
  }

  /**
   * Indicates whether the session is ended and user should be logged-out
   * @param time
   */
  sessionEnded(time: number): boolean {
    return time <= 0 && this.sessionTimeout > 0
  }

  /**
   * Returns session timeout in seconds. If "-1", there's no session and session tracking is enabled.
   */
  getSessionTimeout(): number {
    return this.sessionTimeout
  }

  shouldResetTimer(): boolean {
    return this.resetTimer
  }

  clearResetTimerFlag() {
    this.resetTimer = false
  }

  async fetchConfiguration(): Promise<void> {
    this.sessionTimeout = -1
    this.sessionConfig = await fetchPath<SessionConfig>('auth/config/session-timeout?t=' + Date.now(), {
      success: data => {
        const cfg = JSON.parse(data) as SessionConfig
        if (!cfg.timeout || cfg.timeout <= 0) {
          cfg.timeout = -1
        }
        cfg.res = Date.now()
        log.info('Session configuration', cfg)
        return cfg
      },
      error: () => {
        return { timeout: -1 }
      },
    })
    if (this.sessionConfig.timeout > 0) {
      // session expires at "current server time + session timeout". Subtracting current client time we roughly
      // get session end time from client point of view
      this.sessionTimeout = Math.floor(
        (this.sessionConfig.timeout * 1000 + this.sessionConfig.now! - this.sessionConfig.req!) / 1000,
      )
      // If server-side session is set to last less than 30 seconds, we skip the logic at client side
      if (this.sessionTimeout <= 30) {
        this.sessionTimeout = -1
      }
    }
  }

  /**
   * Can be used to enable/disable on-click refreshes. Should be disabled when we display a Modal with explicit
   * "keep session" button
   */
  setRefresh(refresh: boolean) {
    this.refresh = refresh
  }
}

export const sessionService = new SessionService()
