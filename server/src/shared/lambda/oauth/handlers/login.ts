import { createCSRFToken } from "../../csrf"
import {
  createAnonymousSessionID,
  readSessionID,
  UserSession,
} from "../../session"
import { OAuthProviderConfig, Config } from "../OAuthProviderConfig"
import { addResponseSession, errorResponse, getProviderName } from "./common"
import { INTERNAL_SERVER_ERROR } from "../../httpStatus"
import { URL } from "url"
import {
  LambdaHttpHandler,
  LambdaHttpRequest,
  LambdaHttpResponse,
} from "../../lambda"
import { UserRepository } from "../repository/UserRepository"

export default function loginHandlerFactory(
  userRepository: UserRepository
): LambdaHttpHandler {
  if (!userRepository) throw new Error("userRepository must be specified")

  // the handler:
  async function loginHandler(
    req: LambdaHttpRequest
  ): Promise<LambdaHttpResponse> {
    /**
     * This is where we start the login flow. Uses the following steps:
     * 1. Get the provider from query string (?provider=<provider name>)
     * 2. Ensure we have client id, secret, etc. in environment variables from provider name
     * 3. Build URL for provider's authorization endpoint and redirect the user there.
     */
    const [providerName, providerNameError] = getProviderName(req)
    if (providerNameError) {
      return providerNameError
    }

    const conf = new OAuthProviderConfig(providerName)
    const error = conf.validate()
    if (error) {
      return errorResponse(INTERNAL_SERVER_ERROR, error)
    }

    let authUrl: URL
    try {
      authUrl = new URL(conf.value(Config.AuthorizationEndpoint))
    } catch (err) {
      return errorResponse(
        INTERNAL_SERVER_ERROR,
        `the ${conf.name(Config.AuthorizationEndpoint)} value ${conf.value(
          Config.AuthorizationEndpoint
        )} is not a valid URL`
      )
    }
    authUrl.searchParams.append("response_type", "code")
    authUrl.searchParams.append(
      "scope",
      conf.value(Config.Scope) || "openid email"
    )
    authUrl.searchParams.append("client_id", conf.value(Config.ClientID))
    authUrl.searchParams.append(
      "redirect_uri",
      conf.value(Config.RedirectEndpoint)
    )

    // NOTE: If any scopes are requested then Sign in with Apple wants response_mode=form_post
    //   https://developer.apple.com/documentation/sign_in_with_apple/sign_in_with_apple_js/incorporating_sign_in_with_apple_into_other_platforms
    //   https://openid.net/specs/oauth-v2-form-post-response-mode-1_0.html
    if (conf.value(Config.ResponseMode)) {
      authUrl.searchParams.append(
        "response_mode",
        conf.value(Config.ResponseMode)
      )
    }

    let session: UserSession | null = readSessionID(req)
    // if we got a valid session from the request, lets make sure it's also a valid user we know about (e.g. it isn't anonymous and the user hasn't been deleted):
    if (session) {
      const user = await userRepository.get(session.userID)
      if (!user) {
        // eslint-disable-next-line no-console
        console.warn(
          "login: No user found for session",
          session,
          ". Reverting to anonymous session."
        )
      }
    }

    if (!session) {
      session = createAnonymousSessionID()
    }

    authUrl.searchParams.append("state", await createCSRFToken(session.userID))

    let res: LambdaHttpResponse = {
      statusCode: 302,
      headers: {
        location: authUrl.toString(),
      },
      body: "",
    }
    res = addResponseSession(res, session)
    return res
  }
  return loginHandler
}
