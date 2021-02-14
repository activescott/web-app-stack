import {
  TextResponse,
  LambdaHttpHandler,
  LambdaHttpResponse,
  LambdaHttpRequest,
} from "./lambda"
import { readSessionID } from "./session"
import * as STATUS from "./httpStatus"
import { createCSRFToken } from "./csrf"

/**
 * A factory for a handler to return CSRF tokens in response to get requests.
 * The user must have an active session (even as a anonymous session).
 */
export default function csrfGetHandlerFactory(): LambdaHttpHandler {
  async function handlerImp(
    req: LambdaHttpRequest
  ): Promise<LambdaHttpResponse> {
    const session = readSessionID(req)
    if (!session) {
      // NOTE: even an anonymous session is okay for us, and that will come back with a legit session
      return TextResponse(
        STATUS.UNAUTHENTICATED,
        "error: request not authenticated"
      )
    }

    const csrf = await createCSRFToken(session.userID)
    return TextResponse(STATUS.OK, csrf)
  }
  return handlerImp
}
