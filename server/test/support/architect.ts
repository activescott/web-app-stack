import { HttpRequest } from "@architect/functions";

export function createMockRequest(
  requestOverrides: Partial<HttpRequest> = {}
): HttpRequest {
  return {
    httpMethod: "GET",
    path: "",
    resource: "",
    pathParameters: {},
    queryStringParameters: {},
    headers: {},
    body: {},
    isBase64Encoded: false,
    session: {},
    ...requestOverrides,
  }
}
