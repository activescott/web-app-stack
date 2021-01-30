import {
  APIGatewayProxyEventV2,
  APIGatewayProxyStructuredResultV2,
} from "aws-lambda"

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
export function JsonResponse(
  httpStatusCode: number,
  body: any
): LambdaHttpResponse {
  return {
    statusCode: httpStatusCode,
    headers: {
      "content-type": "application/json",
    },
    body: JSON.stringify(body),
  }
}
