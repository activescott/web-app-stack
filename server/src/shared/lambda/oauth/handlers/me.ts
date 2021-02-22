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
  AuthenticatedLambdaHttpHandler,
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
    const methodHandlerMap: Record<string, AuthenticatedLambdaHttpHandler> = {
      get: handleGet,
      delete: handleDelete,
    }
    const handler = methodHandlerMap[
      String(req.requestContext.http.method).toLowerCase()
    ] as LambdaHttpHandler

    if (handler) {
      return handler(req)
    } else {
      return jsonResponse(STATUS.BAD_REQUEST, "HTTP method not supported")
    }
  }

  async function handleDelete(
    req: AuthenticatedLambdaHttpRequest
  ): Promise<LambdaHttpResponse> {
    const user = req.authenticUser
    const identities = await identityRepository.listForUser(user.id)
    for (const ident of identities) {
      await identityRepository.delete(ident.id)
    }
    await userRepository.delete(user.id)
    return jsonResponse(STATUS.OK)
  }

  async function handleGet(
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

  // TODO: The authenticateHandlerFactory shouldn't be used here. Move it to the caller so that tests don't have to handle testing the authentication as well
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
