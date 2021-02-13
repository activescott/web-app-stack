/**
 * Initiates the login flow with the specified provider.
 * @param providerName The name of the provider to start the login flow with
 */
export function doLogin(providerName: string) {
  window.location.href = process.env.PUBLIC_URL + `/auth/login/${providerName}`
}
