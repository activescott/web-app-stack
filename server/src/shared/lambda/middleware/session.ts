import { v4 as uuidv4 } from "uuid"
import {
  CookieSerializeOptions,
  parse as parseCookie,
  serialize as serializeCookie,
} from "cookie"
import { LambdaHttpRequest, LambdaHttpResponse } from "../../lambda"
import { assert } from "console"

/** The name of the session key to get the session ID value.
 * Exported ONLY FOR TESTING.
 */
export const SESSION_COOKIE_NAME = "WAS_SES"

//type HttpResponseLike = { session?: Record<string, string> }
type HttpResponseLike = Pick<LambdaHttpResponse, "cookies">
//type HttpRequestLike = { session?: Record<string, string> }
type HttpRequestLike = Pick<LambdaHttpRequest, "cookies">

/**
 * Writes the specified session ID to the specified response.
 * @param response This is generally a response, but for testing purposes we also use it to write to requests (and ultimately we just need something with a session so...)
 */
export function writeSessionID(
  response: HttpResponseLike,
  sessionID: string
): void {
  response.cookies = response.cookies || []
  // NOTE: Cookies are written in response as a Set-Cookie header per cookie, but read from the user agent request as a single Cookie header
  response.cookies.push(toCookie(SESSION_COOKIE_NAME, sessionID))
}

/** Returns the session id for the given request OR an empty string. */
export function readSessionID(req: HttpRequestLike): string {
  // NOTE: Cookies are written in response as a Set-Cookie header per cookie, but read from the user agent request as a single Cookie header
  const cookieHeader = req.cookies ? req.cookies.join(";") : ""
  const cookies = parseCookie(cookieHeader)
  return SESSION_COOKIE_NAME in cookies ? cookies[SESSION_COOKIE_NAME] : ""
}

/**
 * ONLY FOR TESTING
 * @param req The request
 * @param sessionID
 */
export function injectSessionToRequest(
  req: HttpRequestLike,
  sessionID: string
): void {
  const response: HttpResponseLike = { cookies: [] }
  writeSessionID(response, sessionID)
  assert(response.cookies)
  const stolenCookie = response.cookies ? response.cookies[0] : ""
  req.cookies = req.cookies || []
  req.cookies.push(stolenCookie)
}

/**
 * If the user isn't (yet) authenticated but you need a session id, use this:
 */
export function createAnonymousSessionID(): string {
  return `anon-session-${uuidv4()}`
}

function toCookie(name: string, value: string): string {
  const expires = new Date()
  expires.setFullYear(expires.getFullYear() + 1)
  const options: CookieSerializeOptions = {
    expires,
    httpOnly: true,
    secure: process.env.NODE_ENV === "testing" ? false : true,
    path: "/",
    // we use same-site = none because OAuth response_mode=form_post (which SIWA requires) doesn't send a cookie without it, due to the form submission
    sameSite: "none",
  }
  return serializeCookie(name, value, options)
}
