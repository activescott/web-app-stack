import { UNAUTHENTICATED } from "../../../httpStatus"
import {
  jsonResponse,
  LambdaHttpHandler,
  LambdaHttpRequest,
  LambdaHttpResponse,
} from "../../../lambda"
import { readSession } from "../../../session"
import { StoredUser, UserRepository } from "../../repository/UserRepository"

/**
 * Ensure that the specified request is authenticated by a validate user.
 * If the request is not properly authenticated than an error response is returned.
 * If the request is properly authenticated, the the specified handler is invoked with a an additional `authenticUser` property added to the request with details about the authenticated user fore example:
 * ```
 * {
 *   authenticUser {
 *     id: "user-id-here"
 *   }
 * }
 * ```
 * @param handler The handler to be invoked after the request is authenticated.
 */
export function authenticateHandlerFactory(
  innerHandler: AuthenticatedLambdaHttpHandler,
  userRepository: UserRepository
): LambdaHttpHandler {
  async function authenticateHandler(
    req: LambdaHttpRequest
  ): Promise<LambdaHttpResponse> {
    // get session from request
    const session = readSession(req)
    if (!session) {
      return jsonResponse(UNAUTHENTICATED, {
        error: "request not authenticated",
      })
    }
    // verify user
    let user: StoredUser | null
    try {
      user = await userRepository.get(session.userID)
    } catch (err) {
      user = null
      if (!("UNIT_TESTING" in process.env)) {
        // eslint-disable-next-line no-console
        console.error("exception getting user")
      }
    }
    if (!user) {
      return jsonResponse(UNAUTHENTICATED, {
        error: "user not found",
      })
    }
    // prepare new request:
    const authenticatedRequest = {
      ...req,
      authenticUser: {
        id: user.id,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      },
    }
    // invoke
    return innerHandler(authenticatedRequest)
  }
  return authenticateHandler
}

/**
 * A request with an authenticated user.
 */
export interface AuthenticatedLambdaHttpRequest extends LambdaHttpRequest {
  authenticUser: Pick<StoredUser, "id" | "createdAt" | "updatedAt">
}

/**
 * Defines the type for an AWS Lambda/API Gateway handler that has a request that has been authenticated with the @see authenticateFactory .
 */
export type AuthenticatedLambdaHttpHandler = (
  request: AuthenticatedLambdaHttpRequest
) => Promise<LambdaHttpResponse>
