import assert from "assert"
import {
  LambdaHttpHandler,
  LambdaHttpRequest,
  LambdaHttpResponse,
} from "../../lambda"
import { secretFromEnvironment } from "../../secretEnvironment"
import Tokenater from "../../Tokenater"
import { readSessionID } from "./session"

export const CSRF_HEADER_NAME = "X-CSRF-TOKEN-X"

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

/**
 * Response middleware to add a CSRF token to the response that can be read/validated with the @see expectCsrfTokenWithRequest request middleware function.
 * @param handler Your HTTP handler that should run before this middleware adds the CSRF token header to the response.
 */
export function csrfResponseMiddleware(
  handler: LambdaHttpHandler
): LambdaHttpHandler {
  async function thunk(req: LambdaHttpRequest): Promise<LambdaHttpResponse> {
    const response = await handler(req)
    assert(response, "response expected from handler")
    // get the current session id:
    const session = readSessionID(req)
    if (!session) {
      throw new Error("session not on request session!")
    }
    // add the CSRF token:
    await addCsrfTokenToResponse(session.userID, response)
    return response
  }
  return thunk
}

type HttpResponseLike = Pick<LambdaHttpResponse, "headers">

/**
 * Adds a CSRF token to the specified response object according to the [HMAC Based Token Pattern](https://cheatsheetseries.owasp.org/cheatsheets/Cross-Site_Request_Forgery_Prevention_Cheat_Sheet.html#hmac-based-token-pattern)
 * The token can be validated in a subsequent request with `expectCsrfTokenWithRequest`.
 * The request must also have a session ID header as specified by
 * @param response The http response to add the token to
 */
export async function addCsrfTokenToResponse(
  sessionID: string,
  response: HttpResponseLike
): Promise<void> {
  if (!response) {
    throw new Error("response must be provided")
  }
  response.headers = response.headers || {}
  response.headers[CSRF_HEADER_NAME] = await createCSRFToken(sessionID)
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
