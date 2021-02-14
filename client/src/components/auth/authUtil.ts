import { trackAction } from "../../lib/analytics"

/**
 * Initiates the login flow with the specified provider.
 * @param providerName The name of the provider to start the login flow with
 */
export async function doLogin(providerName: string): Promise<void> {
  trackAction("login")
  window.location.href = process.env.PUBLIC_URL + `/auth/login/${providerName}`
}

/**
 * Initiates the logout procedure.
 */
export async function doLogout(): Promise<void> {
  trackAction("logout")
  window.location.href = process.env.PUBLIC_URL + `/auth/logout`
}
