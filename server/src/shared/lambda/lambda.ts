import {
  APIGatewayProxyEventV2,
  APIGatewayProxyStructuredResultV2,
} from "aws-lambda"
import { INTERNAL_SERVER_ERROR } from "./httpStatus"

/**
 * Defines the type for an AWS Lambda/API Gateway request.
 */
export type LambdaHttpRequest = APIGatewayProxyEventV2

/**
 * Defines the type for an AWS Lambda/API Gateway response.
 */
export type LambdaHttpResponse = APIGatewayProxyStructuredResultV2

/**
 * Defines the type for an AWS Lambda/API Gateway handler.
 */
export type LambdaHttpHandler = (
  request: LambdaHttpRequest
) => Promise<LambdaHttpResponse>

/**
 * Helper to build an response for JSON data.
 * @param httpStatusCode HttpStatus code
 * @param body The boy as an object. It will be converted to json.
 */
export function jsonResponse(
  httpStatusCode: number,
  body: HttpJsonBody
): LambdaHttpResponse {
  return {
    statusCode: httpStatusCode,
    headers: {
      "content-type": "application/json",
    },
    body: JSON.stringify(body),
  }
}
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type HttpJsonBody = any

/**
 * Helper to build an response for plain text data.
 * @param httpStatusCode HttpStatus code
 * @param body The boy as plain text. It will not be parsed or converted.
 */
export function textResponse(
  httpStatusCode: number,
  body: string
): LambdaHttpResponse {
  return {
    statusCode: httpStatusCode,
    headers: {
      "content-type": "text/plain",
    },
    body,
  }
}

/**
 * Returns a response to the browser in HTML with the specified error information.
 * @param httpStatusCode
 * @param message A description about the error
 * @param heading A heading for the error.
 */
export function htmlErrorResponse(
  httpStatusCode = INTERNAL_SERVER_ERROR,
  message: string,
  heading: string = "Login Error"
): LambdaHttpResponse {
  return {
    statusCode: httpStatusCode,
    headers: {
      "Content-Type": "text/html; charset=utf8",
    },
    body: `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${heading}</title>
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
