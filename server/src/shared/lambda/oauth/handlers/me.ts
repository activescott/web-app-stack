import { map } from "irritable-iterable"
import {
  JsonResponse,
  LambdaHttpHandler,
  LambdaHttpRequest,
  LambdaHttpResponse,
} from "../../lambda"
import { readSessionID } from "../../session"
import { IdentityRepository } from "../repository/IdentityRepository"
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
    const session = readSessionID(req)
    if (!session) {
      return JsonResponse(STATUS.UNAUTHENTICATED, {
        error: "request not authenticated",
      })
    }
    const user = await userRepository.get(session.userID)
    if (!user) {
      return JsonResponse(STATUS.NOT_FOUND, {
        error: "user not found",
      })
    }

    // we try to be compliant with the OIDC UserInfo Response: https://openid.net/specs/openid-connect-core-1_0.html#UserInfoResponse
    return JsonResponse(STATUS.OK, {
      sub: user.id,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
      ...(await getProviders(user)),
    })
  }
  return handlerImp

  async function getProviders(
    user: StoredUser
  ): Promise<{ providers: string[] }> {
    const identities = await identityRepository.listForUser(user.id)
    const providers: string[] = map(identities, (t) => t.provider).collect()
    return {
      providers,
    }
  }
}
