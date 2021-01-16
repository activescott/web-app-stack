import {
  ArchitectHttpRequestPayload,
  ArchitectHttpResponsePayload,
  HttpHandler,
} from "../../types/http"
import Tokenater from "../../Tokenater"
import { readSessionID } from "./session"

export const CSRF_HEADER_NAME = "X-CSRF-TOKEN-X"

const HTTP_STATUS_ERROR = 403

/**
 * arc.http.async middleware that returns an error response if the request doesn't contain a a CSRF token header created with `addCsrfTokenToResponse`.
 * @param req The request to look for the CSRF token in.
 */
export function expectCsrfTokenWithRequest(
  req: ArchitectHttpRequestPayload
): ArchitectHttpResponsePayload | void {
  if (!req) {
    throw new Error("request must be provided")
  }
  if (!req.headers || !(CSRF_HEADER_NAME in req.headers)) {
    return {
      statusCode: HTTP_STATUS_ERROR,
      json: {
        message: "missing CSRF token",
      },
    }
  }
  const token = req.headers[CSRF_HEADER_NAME]
  if (!isTokenValid(token, readSessionID(req))) {
    return createErrorResponse("invalid CSRF token")
  }
  // token exists, is valid, and matched to the session so just exit without returning an error response.
}

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
    // don't bother with warnings if we're inside jest
    if (!("CSRF_TOKEN_WARNING_DISABLE" in process.env)) {
      // eslint-disable-next-line no-console
      console.warn("CSRF token is expired or has been tampered with")
    }
    return false
  }
  // our CSRF token has the session id in it. Now that we've validated the token, extract the session id and make sure that it matches
  const csrfSessionID = ater.getTokenValue(token)
  if (csrfSessionID != sessionID) {
    // eslint-disable-next-line no-console
    console.warn("CSRF token does not match session")
    return false
  }
  return true
}

/**
 * Response middleware to add a CSRF token to the response that can be read/validated with the @see expectCsrfTokenWithRequest request middleware function.
 * @param handler Your HTTP handler that should run before this middleware adds the CSRF token header to the response.
 */
export function csrfResponseMiddleware(handler: HttpHandler): HttpHandler {
  async function thunk(
    req: ArchitectHttpRequestPayload
  ): Promise<ArchitectHttpResponsePayload> {
    const response = await handler(req)
    // get the current session id:
    const sessionID = readSessionID(req)
    if (!sessionID) {
      throw new Error("sessionID not on request session!")
    }
    // add the crsf:
    await addCsrfTokenToResponse(sessionID, response)
    return response
  }
  return thunk
}

/**
 * Adds a CSRF token to the specified response object according to the [HMAC Based Token Pattern](https://cheatsheetseries.owasp.org/cheatsheets/Cross-Site_Request_Forgery_Prevention_Cheat_Sheet.html#hmac-based-token-pattern)
 * The token can be validated in a subsequent request with `expectCsrfTokenWithRequest`.
 * The request must also have a session ID header as specified by
 * @param response The http response to add the token to
 */
export async function addCsrfTokenToResponse(
  sessionID: string,
  response: ArchitectHttpResponsePayload
): Promise<void> {
  if (!response) {
    throw new Error("response must be provided")
  }
  response.headers = response.headers || {}
  response.headers[CSRF_HEADER_NAME] = await createCSRFToken(sessionID)
}

function createErrorResponse(
  errorMessage: string
): ArchitectHttpResponsePayload {
  return {
    statusCode: HTTP_STATUS_ERROR,
    json: {
      message: errorMessage,
    },
  }
}

const createTokenater = (): Tokenater =>
  new Tokenater(getSecret(), Tokenater.DAYS_IN_MS * 1)

function getSecret(): string {
  let secret = process.env.CSRF_SECRET
  if (!secret) {
    if (process.env.NODE_ENV == "production") {
      throw new Error(
        "CSRF_SECRET environment variable MUST be provided in production environments"
      )
    }
    // eslint-disable-next-line no-console
    console.warn(
      "CSRF_SECRET environment variable SHOULD be provided in pre-production environments"
    )
    secret = `${process.env.ARC_APP_NAME} not so secret`
  }
  return secret
}
