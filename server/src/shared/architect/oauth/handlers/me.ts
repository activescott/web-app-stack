import { HttpHandler, HttpRequest, HttpResponse } from "@architect/functions"
import { readSessionID } from "../../middleware/session"
import { StoredUser, UserRepository } from "../repository/UserRepository"

import * as STATUS from "./httpStatus"

/**
 * Factory to create a handler for the [Authorization Response](https://tools.ietf.org/html/rfc6749#section-4.1.2) when the user is directed with a `code` from the OAuth Authorization Server back to the OAuth client application.
 * @param req The incoming Architect/APIG/Lambda request.
 */
export default function meHandlerFactory(
  userRepository: UserRepository
): HttpHandler {
  async function handlerImp(
    req: HttpRequest
  ): Promise<HttpResponse> {
    const sessionID = readSessionID(req)
    if (!sessionID) {
      return {
        statusCode: STATUS.UNAUTHENTICATED,
      }
    }
    const user = await userRepository.get(sessionID)
    if (!user) {
      return {
        statusCode: STATUS.NOT_FOUND,
        json: {
          error: "not found",
        },
      }
    }
    // we try to be compliant with the OIDC UserInfo Response:
    return {
      statusCode: STATUS.OK,
      json: {
        sub: user.id,
        email: user.email,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      },
    }
  }
  return handlerImp
}
