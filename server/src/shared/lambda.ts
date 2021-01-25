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
