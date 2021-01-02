import {
  ArchitectHttpRequestPayload,
  ArchitectHttpResponsePayload,
} from "../../../../types/http"
import { OAuthProviderConfig, Config } from "../OAuthProviderConfig"

export default async function login(
  req: ArchitectHttpRequestPayload
): Promise<ArchitectHttpResponsePayload> {
  /**
   * This is where we start the login flow. Uses the following steps:
   * 1. Get the provider from query string (?provider=<provider name>)
   * 2. Ensure we have client id, secret, etc. in environment variables from provider name
   * 3. Build URL for provider's authorization endpoint and redirect the user there.
   */
  const provider = req.queryStringParameters["provider"]
  if (!provider) {
    return errorResponse("provider query string must be provided")
  }
  const conf = new OAuthProviderConfig(provider)
  const validationResponse = validateProviderConfig(conf)
  if (validationResponse) {
    return validationResponse
  }

  let authUrl: URL 
  try {
    authUrl = new URL(conf.value(Config.AuthorizationEndpoint))
  } catch (err) {
    return errorResponse(`the ${conf.name(Config.AuthorizationEndpoint)} value ${conf.value(Config.AuthorizationEndpoint)} is not a valid URL`)
  }
  authUrl.searchParams.append("response_type", "code")
  authUrl.searchParams.append("scope", "profile email")
  authUrl.searchParams.append("client_id", conf.value(Config.ClientID))
  authUrl.searchParams.append("redirect_uri", conf.value(Config.RedirectURL))

  return {
    statusCode: 302,
    headers: {
      location: authUrl.toString(),
    },
  }
}

function validateProviderConfig(
  conf: OAuthProviderConfig
): ArchitectHttpResponsePayload | null {
  const missingConfigs = conf.getMissingConfigNames()
  if (missingConfigs) {
    const joined = missingConfigs.join(", ")
    return errorResponse(
      `The following environment settings must be provided: ${joined}`
    )
  }
}

function errorResponse(errorMessage: string): ArchitectHttpResponsePayload {
  const HTTP_STATUS_ERROR = 400
  return {
    statusCode: HTTP_STATUS_ERROR,
    json: {
      message: errorMessage,
    },
  }
}
