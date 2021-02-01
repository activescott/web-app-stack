import { v4 as uuidv4 } from "uuid"
import {
  CookieSerializeOptions,
  parse as parseCookie,
  serialize as serializeCookie,
} from "cookie"
import { LambdaHttpRequest, LambdaHttpResponse } from "../../lambda"
import { assert } from "console"
import { daysToSeconds, millisecondsToSeconds, secondsToMilliseconds } from "../../time"
import { secretFromEnvironment } from "../../secretEnvironment"
import * as jwt from "node-webtokens"

/** The name of the session key to get the session ID value.
 * Exported ONLY FOR TESTING.
 */
export const SESSION_COOKIE_NAME = "WAS_SES"
const SESSION_EXPIRATION_DURATION_IN_SECONDS = daysToSeconds(30)

type HttpResponseLike = Pick<LambdaHttpResponse, "cookies">
type HttpRequestLike = Pick<LambdaHttpRequest, "cookies">

export interface UserSession {
  /** The userID the session is for. */
  userID: string
  /** Time at which the session was created. Number of seconds since 1970-01-01T0:0:0Z as measured in UTC. */
  createdAt: number
}

/**
 * Writes the specified session ID to the specified response.
 * @param response This is generally a response, but for testing purposes we also use it to write to requests (and ultimately we just need something with a session so...)
 */
export function writeSessionID(
  response: HttpResponseLike,
  session: Pick<UserSession, "userID">
): void {
  response.cookies = response.cookies || []
  // add createdAt to session:
  const fullSession: UserSession = {
    userID: session.userID,
    createdAt: millisecondsToSeconds(Date.now()),
  }
  // NOTE: Cookies are written in response as a Set-Cookie header per cookie, but read from the user agent request as a single Cookie header
  response.cookies.push(toCookie(SESSION_COOKIE_NAME, fullSession))
}

//TODO: rename to readSession

/** Returns the session id for the given request OR an null if no session exists. */
export function readSessionID(req: HttpRequestLike): UserSession | null {
  // NOTE: Cookies are written in response as a Set-Cookie header per cookie, but read from the user agent request as a single Cookie header
  const cookieHeader = req.cookies ? req.cookies.join(";") : ""
  const cookies = parseCookie(cookieHeader)
  const cookie =
    SESSION_COOKIE_NAME in cookies ? cookies[SESSION_COOKIE_NAME] : null
  if (cookie) {
    return jwtToSession(cookie)
  } else {
    return null
  }
}

/**
 * ONLY FOR TESTING
 * @param req The request
 * @param sessionID
 */
export function injectSessionToRequest(
  req: HttpRequestLike,
  session: Pick<UserSession, "userID">
): void {
  const response: HttpResponseLike = { cookies: [] }
  writeSessionID(response, session)
  assert(response.cookies)
  const stolenCookie = response.cookies ? response.cookies[0] : ""
  req.cookies = req.cookies || []
  if (req.cookies.length > 0) {
    // if there is already a session cookie here, remove it:
    const notSessionCookies = req.cookies.filter(
      (cookieHeader) => !cookieHeader.startsWith(`${SESSION_COOKIE_NAME}=`)
    )
    req.cookies = notSessionCookies
  }
  req.cookies.push(stolenCookie)
}

/**
 * If the user isn't (yet) authenticated but you need a session id, use this:
 */
export function createAnonymousSessionID(): UserSession {
  return {
    userID: `anon-session-${uuidv4()}`,
    createdAt: Math.floor(millisecondsToSeconds(Date.now())),
  }
}

const JWT_ISSUER = "web-app-stack"
const JWT_AUDIENCE = "web-app-stack"

function jwtSecret(): string {
  const secret = secretFromEnvironment(
    "WAS_SESSION_SECRET",
    `${process.env.NODE_ENV}`
  )
  const key = secret.padEnd(32, ".")
  // NOTE: node-webtokens requires it to be in base64 format:
  return Buffer.from(key, "utf-8").toString("base64")
}

function sessionToJWT(session: UserSession): string {
  const requiredProps = ["userID", "createdAt"]
  const missingProps = requiredProps.filter(
    (prop) =>
      !(prop in session) ||
      !((session as unknown) as Record<string, string | number>)[prop]
  )
  if (missingProps.length > 0) {
    throw new Error(
      "attempted to serialize session with missing props: " +
        missingProps.join(",")
    )
  }
  return jwt.generate(
    "HS256",
    {
      iss: JWT_ISSUER,
      aud: JWT_AUDIENCE,
      exp: millisecondsToSeconds(Date.now()) + SESSION_EXPIRATION_DURATION_IN_SECONDS,
      sub: session.userID,
      iat: session.createdAt,
    },
    jwtSecret()
  )
}

function jwtToSession(jwtString: string): UserSession | null {
  // TODO:
  const parsed = jwt
    .parse(jwtString)
    .setIssuer([JWT_ISSUER])
    .setAudience([JWT_AUDIENCE])
    .verify(jwtSecret())

  // See https://www.npmjs.com/package/node-webtokens
  if (parsed.error) {
    console.error(
      "unable to deserialize session:" + JSON.stringify(parsed.error, null, 2)
    )
    return null
  } else if (parsed.expired) {
    console.error("session token expired")
    return null
  }

  const expectedClaims = ["sub", "iat"]
  const missingClaims = expectedClaims.filter(
    (claim) => !(claim in parsed.payload)
  )
  if (missingClaims.length > 0) {
    console.error(
      "the following claims are missing in session jwt:",
      missingClaims
    )
    return null
  }
  return {
    userID: parsed.payload.sub,
    createdAt: parsed.payload.iat,
  }
}

function toCookie(name: string, value: UserSession): string {
  const expires = new Date(Date.now() + secondsToMilliseconds(SESSION_EXPIRATION_DURATION_IN_SECONDS))
  const options: CookieSerializeOptions = {
    expires,
    httpOnly: true,
    secure: process.env.NODE_ENV === "testing" ? false : true,
    path: "/",
    // we use same-site = none because OAuth response_mode=form_post (which SIWA requires) doesn't send a cookie without it, due to the form submission
    sameSite: "none",
  }
  return serializeCookie(name, sessionToJWT(value), options)
}
