import { map } from "irritable-iterable"
import {
  jsonResponse,
  LambdaHttpHandler,
  LambdaHttpResponse,
} from "../../lambda"
import { IdentityRepository } from "../repository/IdentityRepository"
import { StoredUser, UserRepository } from "../repository/UserRepository"
import * as STATUS from "../../httpStatus"
import {
  AuthenticatedLambdaHttpRequest,
  authenticateHandlerFactory,
} from "./middleware/authenticate"

/**
 * Factory to create a handler for the /me endpoint which roughly corresponds to the OpenID Connect UserInfo endpoint.
 * @param req The incoming Architect/APIG/Lambda request.
 */
export default function meHandlerFactory(
  userRepository: UserRepository,
  identityRepository: IdentityRepository
): LambdaHttpHandler {
  async function handlerImp(
    req: AuthenticatedLambdaHttpRequest
  ): Promise<LambdaHttpResponse> {
    const user = req.authenticUser
    // we try to be compliant with the OIDC UserInfo Response: https://openid.net/specs/openid-connect-core-1_0.html#UserInfoResponse
    return jsonResponse(STATUS.OK, {
      sub: user.id,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
      ...(await getIdentities(user)),
    })
  }

  return authenticateHandlerFactory(handlerImp, userRepository)

  type ApiIdentity = {
    id: string
    provider: string
    sub: string
  }

  async function getIdentities(
    user: StoredUser
  ): Promise<{ identities: ApiIdentity[] }> {
    const stored = await identityRepository.listForUser(user.id)
    const identities: ApiIdentity[] = map(stored, (id) => {
      return {
        id: id.id,
        provider: id.provider,
        // NOTE: DynamoDB reserves the "sub" attribute and throws an error if se use it, so we fix it in our API to use the standard OIDC claim "sub"
        sub: id.subject,
      }
    }).collect()
    return {
      identities,
    }
  }
}
