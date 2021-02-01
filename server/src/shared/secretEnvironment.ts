/**
 * Gets a secret value from the specified environment variable.
 * In production environments, if the variable isn't found an exception will be thrown.
 * In non-production environments a warning logged and `fallbackValue` is returned.
 * @param environmentName The environment variable containing the secret value.
 * @param fallbackValue
 */
export function secretFromEnvironment(
  environmentName: string,
  fallbackValue: string
): string {
  let secret = process.env[environmentName]
  if (!secret) {
    if (process.env.NODE_ENV == "production") {
      throw new Error(
        `${environmentName} environment variable MUST be provided in production environments`
      )
    }
    // eslint-disable-next-line no-console
    console.warn(
      `${environmentName} environment variable SHOULD be provided in pre-production environments. This will cause an exception im production.`
    )
    secret = fallbackValue
  }
  return secret
}
