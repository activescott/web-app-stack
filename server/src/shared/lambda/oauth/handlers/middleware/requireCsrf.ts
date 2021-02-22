import { CSRF_HEADER_NAME, isTokenValid } from "../../../csrf"
import { FORBIDDEN } from "../../../httpStatus"
import { jsonResponse, LambdaHttpResponse } from "../../../lambda"
import {
  AuthenticatedLambdaHttpHandler,
  AuthenticatedLambdaHttpRequest,
} from "./authenticate"

/**
 * Ensures that the request has a valid CSRF token before invoking the specified handler.
 * The handler created by this factory must be invoked with a request that has the @see AuthenticatedLambdaHttpRequest.authenticUser property identifying the user (i.e. use @see authenticateHandlerFactory ).
 * @param innerHandler The handler to invoke and return a response from IF the CSRF validation succeeds.
 */
export function requireCsrfHandlerFactory(
  innerHandler: AuthenticatedLambdaHttpHandler
): AuthenticatedLambdaHttpHandler {
  async function requireCsrfHandler(
    req: AuthenticatedLambdaHttpRequest
  ): Promise<LambdaHttpResponse> {
    // get token
    const token = req.headers[CSRF_HEADER_NAME]
    if (!token) {
      return jsonResponse(FORBIDDEN, "CSRF token required")
    }
    // validate token
    if (!isTokenValid(token, req.authenticUser.id)) {
      return jsonResponse(FORBIDDEN, "CSRF token invalid")
    }
    return innerHandler(req)
  }
  return requireCsrfHandler
}
