import { LambdaHttpRequest } from "../../src/http/post-auth-redirect-000provider/node_modules/@architect/shared/lambda"

export function createMockRequest(
  requestOverrides: Partial<LambdaHttpRequest> = {}
): LambdaHttpRequest {
  return {
    requestContext: {
      http: {
        method: "GET",
        path: "",
        protocol: "",
        sourceIp: "",
        userAgent: "",
      },
      accountId: "",
      apiId: "",
      domainName: "",
      domainPrefix: "",
      requestId: "",
      routeKey: "",
      stage: "",
      time: "",
      timeEpoch: 0,
    },
    pathParameters: {},
    queryStringParameters: {},
    headers: {},
    body: "",
    isBase64Encoded: false,
    version: "",
    routeKey: "",
    rawPath: "",
    rawQueryString: "",
    ...requestOverrides,
  }
}
