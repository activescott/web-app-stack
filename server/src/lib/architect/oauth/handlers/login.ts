import {
  ArchitectHttpRequestPayload,
  ArchitectHttpResponsePayload,
} from "../../../../types/http"
import { createCSRFToken } from "../../middleware/csrf"
import {
  createAnonymousSessionID,
  readSessionID,
} from "../../middleware/session"
import { OAuthProviderConfig, Config } from "../OAuthProviderConfig"
import { addResponseSession, errorResponse, getProviderName } from "./common"
import { BAD_REQUEST } from "./httpStatus"

export default async function login(
  req: ArchitectHttpRequestPayload
): Promise<ArchitectHttpResponsePayload> {
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
    return errorResponse(BAD_REQUEST, error)
  }

  let authUrl: URL
  try {
    authUrl = new URL(conf.value(Config.AuthorizationEndpoint))
  } catch (err) {
    return errorResponse(
      BAD_REQUEST,
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

  const sessionID: string = readSessionID(req) || createAnonymousSessionID()
  authUrl.searchParams.append("state", await createCSRFToken(sessionID))

  let res: ArchitectHttpResponsePayload = {
    statusCode: 302,
    headers: {
      location: authUrl.toString(),
    },
  }
  res = addResponseSession(res, sessionID)
  return res
}
