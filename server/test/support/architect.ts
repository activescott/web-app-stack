import { ArchitectHttpRequestPayload, HttpMethods } from "../../src/types/http"

export function createMockRequest(
  httpMethod: HttpMethods = "GET"
): ArchitectHttpRequestPayload {
  return {
    httpMethod: httpMethod,
    path: "",
    resource: "",
    pathParameters: {},
    queryStringParameters: {},
    headers: {},
    body: {},
    isBase64Encoded: false,
    session: {},
  }
}
