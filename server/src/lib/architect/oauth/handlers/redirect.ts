import {
  ArchitectHttpRequestPayload,
  ArchitectHttpResponsePayload,
  HttpHandler,
} from "../../../../types/http"
import { fetchJson as fetchJsonImpl, FetchJsonFunc } from "../../../fetch"
import { isTokenValid } from "../../middleware/csrf"
import { readSessionID } from "../../middleware/session"
import { Config, OAuthProviderConfig } from "../OAuthProviderConfig"
import {
  BAD_REQUEST,
  INTERNAL_SERVER_ERROR,
  UNAUTHENTICATED,
} from "./httpStatus"

/**
 * Factory to create a handler for the [Authorization Response](https://tools.ietf.org/html/rfc6749#section-4.1.2) when the user is directed with a `code` from the OAuth Authorization Server back to the OAuth client application.
 * @param req The incoming Architect/APIG/Lambda request.
 */
export default function oAuthRedirectHandlerFactory(
  fetchJson: FetchJsonFunc = fetchJsonImpl
): HttpHandler {
  // This is the actual implementation. We're returning it from a factory so we can inject a mock fetch here. Injection is better than jest's auto-mock voodoo due to introducing time-wasting troubleshooting
  async function oauthRedirectHandler(
    req: ArchitectHttpRequestPayload
  ): Promise<ArchitectHttpResponsePayload> {
    // first check for errors from the provider (we don't need any info to handle these):
    const providerError = handleProviderErrors(req)
    if (providerError) return providerError

    // get the provider and load configuration:
    const provider = req.queryStringParameters["provider"]
    if (!provider) {
      return errorResponse(
        BAD_REQUEST,
        "provider query string must be provided"
      )
    }
    const conf = new OAuthProviderConfig(provider)
    const configError = conf.validate()
    if (configError) {
      return errorResponse(INTERNAL_SERVER_ERROR, configError)
    }

    // handle state validation (which we implement as a CSRF token):
    const stateError = validateState(req)
    if (stateError) {
      return stateError
    }

    // so far so good, get the code and prepare a token request
    const code = req.queryStringParameters.code
    if (!code) {
      return errorResponse(BAD_REQUEST, "code not present")
    }

    let tokenResponse = null
    try {
      tokenResponse = await requestTokens(fetchJson, code, conf)
    } catch (err) {
      return errorResponse(
        INTERNAL_SERVER_ERROR,
        "Access Token Request failed: " + err
      )
    }

    // TODO: save tokens

    return {
      headers: {
        location: process.env.NODE_ENV === "staging" ? "/staging" : "/",
      },
      statusCode: 302,
    }
  }

  return oauthRedirectHandler
}

function validateState(
  req: ArchitectHttpRequestPayload
): ArchitectHttpResponsePayload | null {
  const state = req.queryStringParameters.state
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
  req: ArchitectHttpRequestPayload
): ArchitectHttpResponsePayload | null {
  const errorParam = req.queryStringParameters.error
  if (!errorParam) {
    return null
  }
  // see https://tools.ietf.org/html/rfc6749#section-4.1.2.1
  const unauthorizedErrorMap = {
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

async function requestTokens(
  fetchJson: FetchJsonFunc,
  code: string,
  conf: OAuthProviderConfig
) {
  let url = conf.value(Config.TokenEndpoint)
  url = url + `?code=${code}`
  url = url + `&client_id=${conf.value(Config.ClientID)}`
  url = url + `&client_secret=${conf.value(Config.ClientSecret)}`
  url = url + `&redirect_uri=${conf.value(Config.RedirectURL)}`
  url = url + "&grant_type=authorization_code"

  const json = await fetchJson(url)
}

function errorResponse(
  httpStatusCode = INTERNAL_SERVER_ERROR,
  errorMessage: string
): ArchitectHttpResponsePayload {
  return {
    statusCode: httpStatusCode,
    html: `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Architect</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    body {
      font-family: -apple-system, sans-serif;
    }
    .padding-32 {
      padding: 2rem;
    }
    .max-width-320 {
      max-width: 20rem;
    }
    .margin-left-8 {
      margin-left: 0.5rem;
    }
    .margin-bottom-16 {
      margin-bottom: 1rem;
    }
  </style>
</head>
<body class="padding-32">
  <div class="max-width-320">
    <div class="margin-left-8">
      <h1 class="margin-bottom-16">
        Login Error 
      </h1>
      <p class="margin-bottom-8">
        ${errorMessage}
      </p>
    </div>
  </div>
</body>
</html>
`,
  }
}
