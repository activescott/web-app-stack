import { fetchJson as fetchJsonImpl, FetchJsonFunc } from "../../../fetch"
import { isTokenValid } from "../../middleware/csrf"
import { readSessionID } from "../../middleware/session"
import { Config, OAuthProviderConfig } from "../OAuthProviderConfig"
import { IdentityRepository } from "../repository/IdentityRepository"
import { StoredUser, UserRepository } from "../repository/UserRepository"
import {
  BAD_REQUEST,
  INTERNAL_SERVER_ERROR,
  UNAUTHENTICATED,
  FORBIDDEN,
} from "./httpStatus"
import * as jwt from "node-webtokens"
import { addResponseSession, errorResponse, getProviderName } from "./common"
import { URL, URLSearchParams } from "url"
import { appleSecret } from "../apple"
import assert from "assert"
import {
  LambdaHttpHandler,
  LambdaHttpRequest,
  LambdaHttpResponse,
} from "../../../lambda"
import { secondsToMilliseconds } from "../../../time"

/**
 * Factory to create a handler for the [Authorization Response](https://tools.ietf.org/html/rfc6749#section-4.1.2) when the user is directed with a `code` from the OAuth Authorization Server back to the OAuth client application.
 * @param req The incoming Architect/APIG/Lambda request.
 */
export default function oAuthRedirectHandlerFactory(
  fetchJson: FetchJsonFunc = fetchJsonImpl,
  userRepository: UserRepository,
  identityRepository: IdentityRepository
): LambdaHttpHandler {
  // This is the actual implementation. We're returning it from a factory so we can inject a mock fetch here. Injection is better than jest's auto-mock voodoo due to introducing time-wasting troubleshooting
  async function oauthRedirectHandler(
    req: LambdaHttpRequest
  ): Promise<LambdaHttpResponse> {
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
      return errorResponse(INTERNAL_SERVER_ERROR, "Token request failed.")
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

    const claimsError = validateClaims(parsed.payload, providerName)
    if (claimsError) {
      return claimsError
    }

    let user: StoredUser | null = null
    // lookup an existing user for the current session (the user may have an active session by signing in with a different identity provider):
    const session = readSessionID(req)
    if (session) {
      // user has a valid session (it could be an anonymous session though):
      user = await userRepository.get(session.userID)
    }

    // see if any user has logged in and authenticated with this external identity before:
    const existingIdentity = await identityRepository.getByProviderSubject(
      providerName,
      parsed.payload.sub
    )

    // if the current session is an authenticated/non-anonymous user then we must make sure no other user is already logged in with this external identity:
    if (user && existingIdentity && user.id !== existingIdentity.userID) {
      // eslint-disable-next-line no-console
      console.error(
        "The user",
        user.id,
        "attempted to link to external identity from provider",
        existingIdentity.provider,
        "with subject",
        existingIdentity.subject,
        "but that identity is already linked to different user id",
        existingIdentity.userID
      )
      return errorResponse(
        FORBIDDEN,
        "This identity is already linked to another user in this application. Please login with that user and unlink it, then login again with this user to link it to this user."
      )
    }

    // create user (if they don't exist already):
    if (!user) {
      user = await userRepository.create()
    }

    assert(user != null, "user was not found and was not created?")

    // save identity & access/refresh tokens
    await identityRepository.upsert({
      userID: user.id,
      provider: providerName,
      subject: parsed.payload.sub,
      access_token: tokenResponse.access_token,
      refresh_token: tokenResponse.refresh_token,
      expires_at: Date.now() + secondsToMilliseconds(tokenResponse.expires_in),
    })

    let res: LambdaHttpResponse = {
      statusCode: 302,
      body: "",
    }
    res = addResponseHeaders(res)
    res = addResponseSession(res, { userID: user.id })
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
function parseParameters(req: LambdaHttpRequest): OAuthResponseParameters {
  // TODO NO any
  const method: string = req.requestContext.http.method || ""
  if (method.toUpperCase() === "GET") {
    // query parameters
    return {
      error: req?.queryStringParameters?.error || null,
      code: req?.queryStringParameters?.code || null,
      state: req?.queryStringParameters?.state || null,
    }
  } else if (method.toUpperCase() === "POST") {
    // form_post response_mode per https://openid.net/specs/oauth-v2-form-post-response-mode-1_0.html
    const parsed = new URLSearchParams(req.body)
    // eslint-disable-next-line no-console
    console.log("redirect params (POST):", parsed)
    return {
      error: parsed.get("error"),
      code: parsed.get("code"),
      state: parsed.get("state"),
    }
  } else {
    throw new Error(`Unexpected redirect method '${method}'`)
  }
}

function addResponseHeaders(res: LambdaHttpResponse): LambdaHttpResponse {
  return {
    ...res,
    headers: {
      ...res.headers,
      location: "/",
    },
  }
}

/**
 * Returns an error response if the claims are invalid or null if validation succeeds
 * @param idTokenClaims The parsed payload/claims from the id token
 */
function validateClaims(
  idTokenClaims: Record<string, string>,
  providerName: string
): LambdaHttpResponse | null {
  const expectedClaims = ["email", "sub"]
  for (const claim of expectedClaims) {
    if (!idTokenClaims[claim]) {
      // eslint-disable-next-line no-console
      console.error(
        `No ${claim} claim in parsed token for provider '${providerName}'. Keys were:`,
        Object.keys(idTokenClaims)
      )
      return errorResponse(
        UNAUTHENTICATED,
        `ID token does not contain ${claim} claim.`
      )
    }
  }
  // TODO: look for `email_verified: true` in response. Is that OIDC standard claim?
  return null
}

function validateState(
  responseParams: OAuthResponseParameters,
  req: LambdaHttpRequest
): LambdaHttpResponse | null {
  const state = responseParams.state
  if (!state) {
    return errorResponse(UNAUTHENTICATED, "state is not present")
  }
  const session = readSessionID(req)
  if (!session) {
    return errorResponse(
      UNAUTHENTICATED,
      "active session required to validate state"
    )
  }

  if (!isTokenValid(state, session.userID)) {
    return errorResponse(UNAUTHENTICATED, "state is not valid")
  }
  return null
}

/**
 * Returns a response for the error if the provider specified an error in the request (i.e. with `error` param)
 */
function handleProviderErrors(
  params: OAuthResponseParameters
): LambdaHttpResponse | null {
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
