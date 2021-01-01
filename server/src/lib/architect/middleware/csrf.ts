import {
  ArchitectHttpRequestPayload,
  ArchitectHttpResponsePayload,
  HttpHandler,
} from "../../../types/http"
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
  const ater = createTokenater()
  if (!ater.isValid(token)) {
    return createErrorResponse("invalid CSRF token")
  }
  // our CSRF token has the session id in it. Now that we've validated the token, extract the session id and make sure that it matches
  const csrfSessionID = ater.getTokenValue(token)
  if (csrfSessionID != readSessionID(req)) {
    return createErrorResponse("CSRF token doesn't match session")
  }
  // token exists, is valid, and matched to the session so just exit without returning an error response.
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
  const ater = createTokenater()
  response.headers[CSRF_HEADER_NAME] = await ater.createToken(sessionID)
}

const createTokenater = (): Tokenater =>
  new Tokenater(getSecret(), Tokenater.DAYS * 1)

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
    secret = "not so secret"
  }
  return secret
}
