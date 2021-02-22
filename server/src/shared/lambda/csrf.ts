import { secretFromEnvironment } from "../secretEnvironment"
import Tokenater from "../Tokenater"

// NOTE: at least in local dev, APIG or Lambda or something translates all headers to all lowercase.
export const CSRF_HEADER_NAME = "x-csrf-token"

/**
 * Creates a CSRF token that is matched to the specified user ID.
 * @param userID The user id that the token should be matched to
 */
export async function createCSRFToken(userID: string): Promise<string> {
  const ater = createTokenater()
  return ater.createToken(userID)
}

/**
 * Indicates if the specified token is valid for the specified user id.
 * @param token The CSRF token to validate.
 * @param userID The user that this CSRF token should be matched to.
 */
export function isTokenValid(token: string, userID: string): boolean {
  const ater = createTokenater()
  if (!ater.isValid(token)) {
    warn("CSRF token is expired or has been tampered with")
    return false
  }
  // our CSRF token has the user id in it. Now that we've validated the token, extract the user id and make sure that it matches
  const csrfUserID = ater.getTokenValue(token)
  if (csrfUserID != userID) {
    warn("CSRF token does not match user:", csrfUserID, "!=", userID)
    return false
  }
  return true
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function warn(message?: any, ...optionalParams: any[]): void {
  if (!("CSRF_TOKEN_WARNING_DISABLE" in process.env)) {
    // eslint-disable-next-line no-console
    console.warn(message, optionalParams)
  }
}

const createTokenater = (): Tokenater =>
  new Tokenater(getSecret(), Tokenater.DAYS_IN_MS * 1)

function getSecret(): string {
  const KEY_LENGTH = 32
  return secretFromEnvironment(
    "WAS_CSRF_SECRET",
    `${process.env.NODE_ENV}`
  ).padEnd(KEY_LENGTH, ".")
}
