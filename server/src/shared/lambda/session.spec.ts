import {
  writeSessionID,
  readSessionID,
  UserSession,
  createAnonymousSessionID,
} from "./session"
import { createMockRequest } from "../../../test/support/lambda"

describe("session", () => {
  let testSesson: UserSession

  beforeEach(() => {
    testSesson = createAnonymousSessionID()
  })

  it("should add and read the same session id", async () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const response: any = {}
    writeSessionID(response, testSesson)
    expect(response).toHaveProperty("cookies")
    // steal the cookie for the read test:
    const stolenCookie = response.cookies[0]

    // read it:
    const req = createMockRequest({ cookies: [stolenCookie] })
    const found = readSessionID(req)
    expect(found).toStrictEqual(testSesson)
  })
})
