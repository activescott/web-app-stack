import { createMockRequest } from "../../../../test/support/architect"
import { LambdaHttpResponse } from "../../lambda"
import {
  addCsrfTokenToResponse,
  expectCsrfTokenWithRequest,
  CSRF_HEADER_NAME,
} from "./csrf"
import { injectSessionToRequest } from "./session"

describe("csrf", () => {
  describe("response middleware", () => {
    it("should write csrf token to response", async () => {
      const res: LambdaHttpResponse = {}
      await addCsrfTokenToResponse("foo", res)
      expect(res).toHaveProperty("headers")
      expect(res.headers).toHaveProperty(CSRF_HEADER_NAME)
    })

    it.todo("should test the csrfResponseMiddleware func")
  })

  describe("request middleware", () => {
    it("should accept requests with valid csrf token", async () => {
      // CSRF tokens are bound to a session id, so we mock that here and add it to the mock request:
      const req = createMockRequest()
      const sessionID = "fooID"
      injectSessionToRequest(req, sessionID)
      // get a valid token
      const tempResponse: LambdaHttpResponse = {}
      await addCsrfTokenToResponse(sessionID, tempResponse)

      // add token to request:
      req.headers = {}
      req.headers[CSRF_HEADER_NAME] = (tempResponse.headers
        ? tempResponse.headers[CSRF_HEADER_NAME]
        : "") as string

      // ensure that it is accepted (request middleware will return no response if all is well):
      const res = expectCsrfTokenWithRequest(req)
      expect(res).toBeUndefined()
    })

    it("should reject requests with missing csrf token", () => {
      const req = createMockRequest()
      const res = expectCsrfTokenWithRequest(req)
      expect(res).not.toBeNull()
      expect(res).toHaveProperty("statusCode", 403)
      // TODO: is expect.stringMatching necessary?
      expect(res).toHaveProperty(
        "body",
        expect.stringMatching(/missing CSRF token/)
      )
    })

    it("should reject requests with invalid csrf token", () => {
      const req = createMockRequest()
      req.headers = {}
      req.headers[CSRF_HEADER_NAME] = "foo"
      const res = expectCsrfTokenWithRequest(req)
      expect(res).not.toBeNull()
      expect(res).toHaveProperty("statusCode", 403)
      // TODO: is expect.stringMatching necessary?
      expect(res).toHaveProperty(
        "body",
        expect.stringMatching(/invalid CSRF token/)
      )
    })
  })
})
