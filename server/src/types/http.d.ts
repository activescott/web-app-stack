export type HttpMethods = "GET" | "POST" | "PATCH" | "PUT" | "DELETE"

/* eslint-disable @typescript-eslint/no-explicit-any */
type SessionData = any
type JsonBody = any
type RequestBody = any
/* eslint-enable @typescript-eslint/no-explicit-any */

/**
 * https://arc.codes/primitives/http#req
 */
export interface ArchitectHttpRequestPayload {
  httpMethod: HttpMethods
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
  body: RequestBody

  /**
   * Indicates whether body is base64-encoded binary payload (will always be true if body has not null)
   */
  isBase64Encoded: boolean

  /**
   * When the request/response is run through arc.http.async (https://arc.codes/docs/en/reference/runtime/node#arc.http.async) then it will have session added.
   */
  session?: SessionData
}

/**
 * https://arc.codes/primitives/http#res
 */
export interface ArchitectHttpResponsePayload {
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
  body?: string

  /**
   * Indicates whether body is base64-encoded binary payload
   * Required to be set to true if emitting a binary payload
   */
  isBase64Encoded?: boolean

  /**
   * When the request/response is run through arc.http.async (https://arc.codes/docs/en/reference/runtime/node#arc.http.async) then it will have session added.
   */
  session?: SessionData

  /**
   * When used with https://arc.codes/docs/en/reference/runtime/node#arc.http.async
   * json sets the Content-Type header to application/json
   */

  json?: JsonBody
}

/**
 * Defines an HttpHandler that works with architect.
 */
interface HttpHandler {
  (req: ArchitectHttpRequestPayload): Promise<ArchitectHttpResponsePayload>
}

/**
 * Defines response middleware that gets to view and modify the request and response before the specified handler does.
 * Use it like so:
 * `export const handler = someResponseMiddleware(myHandler)`
 * or if you want to use arc.http.async request middleware:
 * `export const handler = arc.http.async(someResponseMiddleware(myHandler))`
 */
interface HttpResponseMiddleware {
  (handler: HttpHandler): HttpHandler
}
