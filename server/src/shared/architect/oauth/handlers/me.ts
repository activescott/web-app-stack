import { HttpHandler, HttpRequest, HttpResponse } from "@architect/functions"
import { map } from "irritable-iterable"
import { readSessionID } from "../../middleware/session"
import { TokenRepository } from "../repository/TokenRepository"
import { StoredUser, UserRepository } from "../repository/UserRepository"

import * as STATUS from "./httpStatus"

/**
 * Factory to create a handler for the [Authorization Response](https://tools.ietf.org/html/rfc6749#section-4.1.2) when the user is directed with a `code` from the OAuth Authorization Server back to the OAuth client application.
 * @param req The incoming Architect/APIG/Lambda request.
 */
export default function meHandlerFactory(
  userRepository: UserRepository,
  tokenRepository: TokenRepository
): HttpHandler {
  async function handlerImp(req: HttpRequest): Promise<HttpResponse> {
    const sessionID = readSessionID(req)
    if (!sessionID) {
      return {
        statusCode: STATUS.UNAUTHENTICATED,
        json: {
          error: "request not authenticated",
        },
      }
    }
    const user = await userRepository.get(sessionID)
    if (!user) {
      return {
        statusCode: STATUS.NOT_FOUND,
        json: {
          error: "user not found",
        },
      }
    }

    // we try to be compliant with the OIDC UserInfo Response: https://openid.net/specs/openid-connect-core-1_0.html#UserInfoResponse
    return {
      statusCode: STATUS.OK,
      json: {
        sub: user.id,
        email: user.email,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
        ...(await getProviders(user)),
      },
    }
  }
  return handlerImp

  async function getProviders(
    user: StoredUser
  ): Promise<{ providers: string[] }> {
    try {
      const tokens = await tokenRepository.listForUser(user.id)
      const providers: string[] = map(tokens, (t) => t.provider).collect()
      return {
        providers,
      }
    } catch (err) {
      // providers are non-essential so rather than fail, just log it and return empty providers
      // eslint-disable-next-line no-console
      console.error(err)
      return { providers: [] }
    }
  }
}
