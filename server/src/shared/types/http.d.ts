import { HttpHandler } from "@architect/functions"

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
