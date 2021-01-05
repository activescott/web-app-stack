import { ArchitectHttpRequestPayload } from "../../src/types/http"

export function createMockRequest(
  requestOverrides: Partial<ArchitectHttpRequestPayload> = {}
): ArchitectHttpRequestPayload {
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
