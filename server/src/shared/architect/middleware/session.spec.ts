import { writeSessionID, readSessionID } from "./session"
import { createMockRequest } from "../../../../test/support/architect"
import { randomInt } from "../../../../test/support"

describe("session", () => {
  let testSessionID = ""
  beforeEach(() => {
    testSessionID = "session-id-" + randomInt().toString()
  })

  it("should add and read the same session id", async () => {
    const response: any = {}
    writeSessionID(response, testSessionID)
    expect(response).toHaveProperty("cookies")
    // steal the cookie for the read test:
    const stolenCookie = response.cookies[0]

    // read it:
    const req = createMockRequest({ cookies: [stolenCookie] })
    const found = readSessionID(req)
    expect(found).toStrictEqual(testSessionID)
  })
})
