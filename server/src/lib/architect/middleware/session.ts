/** The name of the session key to get the session ID value */
const SESSION_ID_KEY = "SESS-ID-KEY"

type HttpResponseLike = { session?: Record<string, string> }
type HttpRequestLike = { session?: Record<string, string> }

/**
 * Writes the specified session ID to the specified response.
 * @param response This is generally a response, but for testing purposes we also use it to write to requests (and ultimately we just need something with a session so...)
 */
export function writeSessionID(
  response: HttpResponseLike,
  sessionID: string
): void {
  if (!response.session) {
    // The request probably didn't use arc.http.async middleware https://arc.codes/docs/en/reference/runtime/node#arc.http.async to automatically add the parse `session` field to req.
    throw new Error("missing session middleware")
  }
  // NOTE: arc.http.session is already *signed* so we don't have to worry about tampering of this session ID
  response.session[SESSION_ID_KEY] = sessionID
}

/** Returns the session id for the given request. Assumes the request already has a session id */
export function readSessionID(req: HttpRequestLike): string {
  if (!req.session || !req.session[SESSION_ID_KEY]) {
    return null
  }
  return req.session[SESSION_ID_KEY]
}
