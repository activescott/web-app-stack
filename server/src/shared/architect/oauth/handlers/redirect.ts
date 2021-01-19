import { fetchJson as fetchJsonImpl, FetchJsonFunc } from "../../../fetch"
import { isTokenValid } from "../../middleware/csrf"
import { readSessionID } from "../../middleware/session"
import { Config, OAuthProviderConfig } from "../OAuthProviderConfig"
import { TokenRepository } from "../repository/TokenRepository"
import { StoredUser, UserRepository } from "../repository/UserRepository"
import {
  BAD_REQUEST,
  INTERNAL_SERVER_ERROR,
  UNAUTHENTICATED,
} from "./httpStatus"
import * as jwt from "node-webtokens"
import { assert } from "console"
import { addResponseSession, errorResponse, getProviderName } from "./common"
import { URL, URLSearchParams } from "url"
import { HttpHandler, HttpRequest, HttpResponse } from "@architect/functions"
import { appleSecret } from "../apple"

/**
 * Factory to create a handler for the [Authorization Response](https://tools.ietf.org/html/rfc6749#section-4.1.2) when the user is directed with a `code` from the OAuth Authorization Server back to the OAuth client application.
 * @param req The incoming Architect/APIG/Lambda request.
 */
export default function oAuthRedirectHandlerFactory(
  fetchJson: FetchJsonFunc = fetchJsonImpl,
  userRepository: UserRepository,
  tokenRepository: TokenRepository
): HttpHandler {
  // This is the actual implementation. We're returning it from a factory so we can inject a mock fetch here. Injection is better than jest's auto-mock voodoo due to introducing time-wasting troubleshooting
  async function oauthRedirectHandler(req: HttpRequest): Promise<HttpResponse> {
    const responseParams = parseParameters(req)

    // first check for errors from the provider (we don't need any info to handle these):
    const providerError = handleProviderErrors(responseParams)
    if (providerError) return providerError

    // get the provider and load configuration:
    const [providerName, providerNameError] = getProviderName(req)
    if (providerNameError) {
      return providerNameError
    }

    const conf = new OAuthProviderConfig(providerName)
    const configError = conf.validate()
    if (configError) {
      return errorResponse(INTERNAL_SERVER_ERROR, configError)
    }

    // handle state validation (which we implement as a CSRF token):
    const stateError = validateState(responseParams, req)
    if (stateError) {
      return stateError
    }

    // so far so good, get the code and prepare a token request
    const code = responseParams.code
    if (!code) {
      return errorResponse(BAD_REQUEST, "code not present")
    }

    let tokenResponse = null
    try {
      tokenResponse = await requestTokens(fetchJson, code, conf)
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error("token request failed:" + err)
      return errorResponse(
        INTERNAL_SERVER_ERROR,
        "Token request failed."
      )
    }

    // ensure we got an id_token and use it to create/save a user
    if (!tokenResponse.id_token) {
      return errorResponse(
        UNAUTHENTICATED,
        "An id_token was not returned by the authorization server"
      )
    }

    // NOTE: We don't support encrypted tokens - only signed ones. AFAIK encryption has to be negotiated when registering the client and it's not typical
    const parsed = jwt.parse(tokenResponse.id_token)

    // NOTE: we are skipping token signature validation because we're over HTTPS and it's fine according to spec #6 at https://openid.net/specs/openid-connect-core-1_0.html#IDTokenValidation
    if (parsed.error) {
      return errorResponse(
        INTERNAL_SERVER_ERROR,
        "Could not parse ID token: " + parsed.error
      )
    }

    if (!parsed.payload.email) {
      // TODO: remove id token from logs.
      console.error("no email in parsed token:", tokenResponse.id_token)
      return errorResponse(UNAUTHENTICATED, "ID token does not contain email")
    }

    //TODO: consider looking for `email_verified: true` in response. Is that OIDC standard claim?

    // create user (if they don't exist already):
    let user: StoredUser | null = await userRepository.getFromEmail(
      parsed.payload.email
    )
    if (!user) {
      user = await userRepository.add({ email: parsed.payload.email })
    }
    assert(user != null, "user was not found and was not created?")

    // save access/refresh tokens
    await tokenRepository.upsert({
      userID: user.id,
      provider: providerName,
      access_token: tokenResponse.access_token,
      refresh_token: tokenResponse.refresh_token,
      expires_at: Date.now() + secondsToMilliseconds(tokenResponse.expires_in),
    })

    let res: HttpResponse = {
      statusCode: 302,
    }
    res = addResponseHeaders(res)
    res = addResponseSession(res, user.id)
    return res
  }

  return oauthRedirectHandler
}

type OAuthResponseParameters = {
  error: string | null
  code: string | null
  state: string | null
}

/**
 * Gets the parameters depending on the response_type
 */
function parseParameters(req: HttpRequest): OAuthResponseParameters {
  // TODO NO any
  const method: string = (req as any).requestContext?.http?.method || ""
  if (method.toUpperCase() === "GET") {
    // query parameters
    return {
      error: req.queryStringParameters.error,
      code: req.queryStringParameters.code,
      state: req.queryStringParameters.state,
    }
  } else if (method.toUpperCase() === "POST") {
    // form_post response_mode per https://openid.net/specs/oauth-v2-form-post-response-mode-1_0.html
    const parsed = new URLSearchParams(req.body)
    return {
      error: parsed.get("error"),
      code: parsed.get("code"),
      state: parsed.get("state"),
    }
  } else {
    throw new Error(`Unexpected method '${method}'`)
  }
}

function addResponseHeaders(res: HttpResponse): HttpResponse {
  return {
    ...res,
    headers: {
      ...res.headers,
      location: "/",
    },
  }
}

const MS_PER_SECOND = 1000
const secondsToMilliseconds = (seconds: number): number =>
  seconds * MS_PER_SECOND

function validateState(
  responseParams: OAuthResponseParameters,
  req: HttpRequest
): HttpResponse | null {
  const state = responseParams.state
  if (!state) {
    return errorResponse(UNAUTHENTICATED, "state is not present")
  }
  if (!isTokenValid(state, readSessionID(req))) {
    return errorResponse(UNAUTHENTICATED, "state is not valid")
  }
  return null
}

/**
 * Returns a response for the error if the provider specified an error in the request (i.e. with `error` param)
 */
function handleProviderErrors(
  params: OAuthResponseParameters
): HttpResponse | null {
  const errorParam = params.error
  if (!errorParam) {
    return null
  }
  // see https://tools.ietf.org/html/rfc6749#section-4.1.2.1
  const unauthorizedErrorMap: Record<string, string> = {
    access_denied:
      "The resource owner or authorization server denied the request (access_denied).",
    unauthorized_client:
      "The client is not authorized to request an authorization code using this method (unauthorized_client).",
  }
  if (errorParam in unauthorizedErrorMap) {
    return errorResponse(UNAUTHENTICATED, unauthorizedErrorMap[errorParam])
  }
  // we just handle all other errors as "server error"
  return errorResponse(
    INTERNAL_SERVER_ERROR,
    `An error occurred at the authorization/login server: ${errorParam}`
  )
}

type TokenResponse = {
  access_token: string
  id_token: string
  refresh_token: string
  expires_in: number
}

async function requestTokens(
  fetchJson: FetchJsonFunc,
  code: string,
  conf: OAuthProviderConfig
): Promise<TokenResponse> {
  let clientSecret: string
  if (conf.isSignInWithApple()) {
    clientSecret = appleSecret(
      conf.value(Config.AppleTeamID),
      conf.value(Config.ClientID),
      conf.value(Config.AppleKeyID),
      conf.value(Config.ApplePrivateKey)
    )
  } else {
    clientSecret = conf.value(Config.ClientSecret)
  }
  const endpoint = new URL(conf.value(Config.TokenEndpoint))
  endpoint.searchParams.append("code", code)
  endpoint.searchParams.append("client_id", conf.value(Config.ClientID))
  endpoint.searchParams.append("client_secret", clientSecret)
  endpoint.searchParams.append(
    "redirect_uri",
    conf.value(Config.RedirectEndpoint)
  )
  endpoint.searchParams.append("grant_type", "authorization_code")
  return await fetchJson<TokenResponse>(endpoint.toString(), { method: "POST" })
}
