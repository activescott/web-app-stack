import {
  ArchitectHttpRequestPayload,
  ArchitectHttpResponsePayload,
} from "../../../types/http"
import { v4 as uuidv4 } from "uuid"

/** The name of the session key to get the session ID value */
export const SESSION_ID_KEY = "SESS-ID-KEY"

/**
 * If no request.session.SESSION_ID_TOKEN_HEADER_NAME exists in the session it adds it to request
\ */
export async function addRequestSessionID(
  req: ArchitectHttpRequestPayload
): Promise<ArchitectHttpResponsePayload | null> {
  if (!req.session) {
    // The request probably didn't use arc.http.async middleware https://arc.codes/docs/en/reference/runtime/node#arc.http.async to automatically add the parse `session` field to req.
    return {
      statusCode: 500,
      json: { message: "missing session middleware" },
    }
  }

  // NOTE: arc.http.session is already *signed* so we don't have to worry about tampering of this session ID
  const sessionID = req.session[SESSION_ID_KEY] || newSessionID()

  // now ensure token and session ID are on the request
  req.session[SESSION_ID_KEY] = sessionID
}

/** Returns the session id for the given request. Assumes the request already has a session id */
export function readSessionID(req: ArchitectHttpRequestPayload): string {
  return req.session[SESSION_ID_KEY]
}

const newSessionID = (): string => uuidv4()
