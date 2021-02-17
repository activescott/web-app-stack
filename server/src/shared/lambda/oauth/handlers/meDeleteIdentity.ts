import {
  jsonResponse,
  LambdaHttpHandler,
  LambdaHttpResponse,
} from "../../lambda"
import {
  IdentityRepository,
  StoredIdentity,
} from "../repository/IdentityRepository"
import { UserRepository } from "../repository/UserRepository"
import * as STATUS from "../../httpStatus"
import {
  AuthenticatedLambdaHttpRequest,
  authenticateHandlerFactory,
} from "./middleware/authenticate"
import assert from "assert"
import { requireCsrfHandlerFactory } from "./middleware/requireCsrf"
import { chain } from "irritable-iterable"

/**
 * A factory for a handler that deletes an identity for the current user.
 * @param userRepository
 * @param identityRepository
 */
export default function meDeleteIdentityFactory(
  userRepository: UserRepository,
  identityRepository: IdentityRepository
): LambdaHttpHandler {
  async function handlerImp(
    req: AuthenticatedLambdaHttpRequest
  ): Promise<LambdaHttpResponse> {
    if (req.requestContext.http.method !== "DELETE") {
      return jsonResponse(STATUS.BAD_REQUEST, {
        error: "invalid request method",
      })
    }

    assert(req.authenticUser, "expected request to be authenticated")

    // get id that requested to be deleted
    const IDENTITY_ID_PARAM = "identityID"
    const identityID = req.pathParameters
      ? req.pathParameters[IDENTITY_ID_PARAM]
      : ""
    if (!identityID) {
      return jsonResponse(STATUS.BAD_REQUEST, {
        error: "identityID parameter is required",
      })
    }

    // make sure that the user has more identities – otherwise they'll never be able to login again!
    let allIdentities: StoredIdentity[]
    try {
      allIdentities = chain(
        await identityRepository.listForUser(req.authenticUser.id)
      ).collect()
    } catch (err) {
      allIdentities = []
    }

    // eslint-disable-next-line no-magic-numbers
    if (allIdentities.length < 2) {
      return jsonResponse(STATUS.BAD_REQUEST, {
        error:
          "a user must have at least one remaining identity after deleting",
      })
    }

    // make sure that the specified identity is owned by the current user:
    const foundIdentity: StoredIdentity | undefined = allIdentities.find(
      (candidate) => candidate.id === identityID
    )

    if (!foundIdentity) {
      return jsonResponse(STATUS.NOT_FOUND, {
        error: `identity '${identityID}' not found`,
      })
    }

    if (foundIdentity.userID !== req.authenticUser.id) {
      return jsonResponse(STATUS.FORBIDDEN, {
        error: "identity must be owned by the current user",
      })
    }

    // perform delete operation:
    try {
      await identityRepository.delete(identityID)
    } catch (err) {
      return jsonResponse(STATUS.INTERNAL_SERVER_ERROR, {
        error: "error deleting identity",
      })
    }
    return jsonResponse(STATUS.OK)
  }

  // add CSRF checking:
  const csrfHandler = requireCsrfHandlerFactory(handlerImp)

  // add authentication:
  const authenticatedHandler = authenticateHandlerFactory(
    csrfHandler,
    userRepository
  )
  return authenticatedHandler
}
