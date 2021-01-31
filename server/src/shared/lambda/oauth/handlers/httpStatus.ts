// https://developer.mozilla.org/en-US/docs/Web/HTTP/Status

export const OK = 200
export const BAD_REQUEST = 400
export const UNAUTHENTICATED = 401
/**
 * The HTTP 403 Forbidden client error status response code indicates that the server understood the request but refuses to authorize it.
 * This status is similar to 401, but in this case, re-authenticating will make no difference. The access is permanently forbidden and tied to the application logic, such as insufficient rights to a resource.
 */
export const FORBIDDEN = 403
export const NOT_FOUND = 404
export const INTERNAL_SERVER_ERROR = 500
