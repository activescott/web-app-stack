import { map } from "irritable-iterable"
import {
  jsonResponse,
  LambdaHttpHandler,
  LambdaHttpRequest,
  LambdaHttpResponse,
} from "../../lambda"
import { readSession } from "../../session"
import {
  IdentityRepository,
  StoredIdentity,
} from "../repository/IdentityRepository"
import { StoredUser, UserRepository } from "../repository/UserRepository"

import * as STATUS from "../../httpStatus"

/**
 * Factory to create a handler for the [Authorization Response](https://tools.ietf.org/html/rfc6749#section-4.1.2) when the user is directed with a `code` from the OAuth Authorization Server back to the OAuth client application.
 * @param req The incoming Architect/APIG/Lambda request.
 */
export default function meHandlerFactory(
  userRepository: UserRepository,
  identityRepository: IdentityRepository
): LambdaHttpHandler {
  async function handlerImp(
    req: LambdaHttpRequest
  ): Promise<LambdaHttpResponse> {
    const session = readSession(req)
    if (!session) {
      return jsonResponse(STATUS.UNAUTHENTICATED, {
        error: "request not authenticated",
      })
    }
    const user = await userRepository.get(session.userID)
    if (!user) {
      return jsonResponse(STATUS.NOT_FOUND, {
        error: "user not found",
      })
    }

    // we try to be compliant with the OIDC UserInfo Response: https://openid.net/specs/openid-connect-core-1_0.html#UserInfoResponse
    return jsonResponse(STATUS.OK, {
      sub: user.id,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
      ...(await getProviders(user)),
    })
  }
  return handlerImp

  type ApiIdentity = Pick<StoredIdentity, "id" | "provider" | "subject">

  async function getProviders(
    user: StoredUser
  ): Promise<{ identities: ApiIdentity[] }> {
    const stored = await identityRepository.listForUser(user.id)
    const identities: ApiIdentity[] = map(stored, (id) => {
      return {
        id: id.id,
        provider: id.provider,
        subject: id.subject,
      }
    }).collect()
    return {
      identities,
    }
  }
}
