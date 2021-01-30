import { LambdaHttpResponse } from "../../lambda"
import { addCsrfTokenToResponse, CSRF_HEADER_NAME } from "./csrf"

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
    it.todo("should accept requests with valid csrf token")

    it.todo("should reject requests with missing csrf token")

    it.todo("should reject requests with invalid csrf token")
  })
})
