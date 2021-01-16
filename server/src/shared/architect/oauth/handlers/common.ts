import {
  ArchitectHttpRequestPayload,
  ArchitectHttpResponsePayload,
} from "../../../types/http"
import { writeSessionID } from "../../middleware/session"
import { BAD_REQUEST, INTERNAL_SERVER_ERROR } from "./httpStatus"

/**
 * Returns the name of the provider that should be used for authentication from the specified request.
 */
export function getProviderName(
  req: ArchitectHttpRequestPayload
): [string, ArchitectHttpResponsePayload | null] {
  const PROVIDER_NAME_PARAM = "provider"
  const provider = req.pathParameters[PROVIDER_NAME_PARAM]
  if (!provider) {
    const err = errorResponse(
      BAD_REQUEST,
      "provider path parameter must be specified"
    )
    return ["", err]
  }
  return [provider, null]
}

/**
 * Creates a session by recording it in the response Arc Session Middleware.
 * NOTE: This expects arc.async request/response/http middleware to be used.
 */
export function addResponseSession(
  res: ArchitectHttpResponsePayload,
  userID: string
): ArchitectHttpResponsePayload {
  if (!res.session) {
    res.session = {} as Record<string, string>
  }
  writeSessionID(res, userID)
  return res
}

/**
 * Returns a response to the browser in HTML with the specified error information.
 * @param httpStatusCode
 * @param message A description about the error
 * @param heading A heading for the error.
 */
export function errorResponse(
  httpStatusCode = INTERNAL_SERVER_ERROR,
  message: string,
  heading: string = "Login Error"
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
        ${heading} 
      </h1>
      <p class="margin-bottom-8">
        ${message}
      </p>
    </div>
  </div>
</body>
</html>
`,
  }
}
