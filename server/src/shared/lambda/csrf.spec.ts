import sinon from "sinon"
import { randomInt } from "../../../test/support"
import { createCSRFToken, isTokenValid } from "./csrf"

describe("csrf", () => {
  // preserve environment
  const OLD_ENV = process.env
  afterAll(() => {
    process.env = OLD_ENV
  })

  afterEach(() => {
    process.env = OLD_ENV
  })

  afterEach(() => {
    sinon.restore()
  })

  describe("isTokenValid", () => {
    it("should accept valid token", async () => {
      const testSessionID = `test-${randomInt()}`
      const tok = await createCSRFToken(testSessionID)
      expect(isTokenValid(tok, testSessionID)).toBeTruthy()
    })

    it("should reject invalid token", async () => {
      const testSessionID = `test-${randomInt()}`
      const tok = await createCSRFToken(testSessionID)
      expect(isTokenValid(tok, testSessionID + "foo")).toBeFalsy()
      expect(isTokenValid(tok, "foo" + testSessionID)).toBeFalsy()
    })

    it("should warn if CSRF_TOKEN_WARNING_DISABLE is not present", async () => {
      const consoleMock = sinon.mock(console)

      delete process.env.CSRF_TOKEN_WARNING_DISABLE
      consoleMock.expects("warn").once()
      const testSessionID = `test-${randomInt()}`
      const tok = await createCSRFToken(testSessionID)
      expect(isTokenValid(tok, "foo")).toBeFalsy()

      sinon.verifyAndRestore()
    })

    it("should not warn if CSRF_TOKEN_WARNING_DISABLE is not present", async () => {
      const consoleMock = sinon.mock(console)

      process.env.CSRF_TOKEN_WARNING_DISABLE = "anything"
      consoleMock.expects("warn").never()
      const testSessionID = `test-${randomInt()}`
      const tok = await createCSRFToken(testSessionID)
      expect(isTokenValid(tok, "foo")).toBeFalsy()

      sinon.verifyAndRestore()
    })
  })

  describe("request middleware", () => {
    it.todo("should accept requests with valid csrf token")

    it.todo("should reject requests with missing csrf token")

    it.todo("should reject requests with invalid csrf token")
  })
})
