import { writeSessionID, readSessionID } from "./session"
import { createMockRequest } from "../../../../test/support/architect"
import { randomInt } from "../../../../test/support"

describe("session", () => {
  let testSessionID = beforeEach(() => {
    testSessionID = "session-id-" + randomInt().toString()
  })

  it("should require http.async session on request", async () => {
    const req = createMockRequest()
    delete req.session
    expect(() => writeSessionID(req, testSessionID)).toThrowError(
      /missing session middleware/
    )
  })

  it("should add and read the same session id", async () => {
    const req = createMockRequest()
    writeSessionID(req, testSessionID)
    expect(req).toHaveProperty("session")

    const found = readSessionID(req)
    expect(found).toStrictEqual(testSessionID)
  })
})
