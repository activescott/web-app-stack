/**
 * https://arc.codes/primitives/http#req
 */
export interface ArchitectHttpRequestPayload {
  httpMethod: "GET" | "POST" | "PATCH" | "PUT" | "DELETE"
  /**
   * The absolute path of the request
   */
  path: string

  /**
   * The absolute path of the request, with resources substituted for actual path parts (e.g. /{foo}/bar)
   */
  resource: string

  /**
   * Any URL params, if defined in your HTTP Function's path (e.g. foo in GET /:foo/bar)
   */
  pathParameters: Record<string, string>

  /**
   * Any query params if present in the client request */
  queryStringParameters: Record<string, string>

  /**
   * All client request headers */
  headers: Record<string, string>

  /**
   * The request body in a base64-encoded buffer. You'll need to parse request.body before you can use it, but Architect provides tools to do this - see parsing request bodies.
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  body: any

  /**
   * Indicates whether body is base64-encoded binary payload (will always be true if body has not null)
   */
  isBase64Encoded: boolean
}

/**
 * https://arc.codes/primitives/http#res
 */
export interface ArchitectResponsePayload {
  /**
   * Sets the HTTP status code
   */
  statusCode?: number

  /**
   * All response headers
   */
  headers?: Record<string, string>

  /**
   * Contains request body, either as a plain string (no encoding or serialization required) or, if binary, base64-encoded buffer
   * Note: The maximum body payload size is 6MB
   */
  body: string

  /**
   * Indicates whether body is base64-encoded binary payload
   * Required to be set to true if emitting a binary payload
   */
  isBase64Encoded?: boolean
}
