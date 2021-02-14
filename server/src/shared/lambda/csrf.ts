import { secretFromEnvironment } from "../secretEnvironment"
import Tokenater from "../Tokenater"

export const CSRF_HEADER_NAME = "X-CSRF-TOKEN"

/**
 * Creates a CSRF token that is matched to the specified session ID.
 * @param sessionID The session id that the token should be matched to
 */
export async function createCSRFToken(sessionID: string): Promise<string> {
  const ater = createTokenater()
  return ater.createToken(sessionID)
}

/**
 * Indicates if the specified token is valid for the specified session id.
 * @param token The CSRF token to validate.
 * @param sessionID The session that this CSRF token should be matched to.
 */
export function isTokenValid(token: string, sessionID: string): boolean {
  const ater = createTokenater()
  if (!ater.isValid(token)) {
    warn("CSRF token is expired or has been tampered with")
    return false
  }
  // our CSRF token has the session id in it. Now that we've validated the token, extract the session id and make sure that it matches
  const csrfSessionID = ater.getTokenValue(token)
  if (csrfSessionID != sessionID) {
    warn("CSRF token does not match session:", csrfSessionID, "!=", sessionID)
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
