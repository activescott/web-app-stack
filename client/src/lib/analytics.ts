import { useEffect } from "react"
import { useUserContext } from "../components/auth/UserProvider"

const isProduction = (): boolean => process.env.NODE_ENV === "production"

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const trace = (...args: any[]): void => {
  if (!isProduction()) {
    // eslint-disable-next-line no-console
    console.log(...args)
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const warn = (...args: any[]): void => {
  // eslint-disable-next-line no-console
  console.warn(...args)
}

/**
 * Tracks a user action on the client.
 * @param event The event/action name.
 * @param properties Any additional properties to log
 */
export const trackAction = (
  event: string,
  properties?: Record<string, string | number>
): void => {
  trace("trackAction", event, properties)
  if (!isProduction()) {
    warn("not tracking analytics actions due to non-production environment")
    return
  }
  // TODO: implement analytics
  warn("trackAction: window or window.analytics unavailable")
}

/**
 * Associate current user to a recognizable userId and traits.
 * https://segment.com/docs/sources/website/analytics.js/#identify
 * @param props
 */
export const Identify = (): JSX.Element | null => {
  const { isAuthenticated, user } = useUserContext()
  useEffect(() => {
    if (isProduction()) {
      if (isAuthenticated && user && window) {
        trace(`identify (${process.env.NODE_ENV})`, {
          sub: user.sub,
          name: user.name,
        })
        /*
        window.analytics.identify(user.sub, {
          name: user.name,
          nickname: user.nickname
        })
        */
      }
      if (isAuthenticated && window && window.Rollbar && user) {
        window.Rollbar?.configure({ payload: { person: { id: user.sub } } })
      }
    } else {
      // only report this warning if we would have otherwise identified:
      if (isAuthenticated) {
        warn(
          "not identifying analytics actions due to non-production environment"
        )
      }
    }
  }, [isAuthenticated, user])
  // TODO: This should be a hook!
  // NOTE: We deliberately don't render anything here. We just want to identify the user.
  return null
}
