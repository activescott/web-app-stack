import { addRequestSessionID, SESSION_ID_KEY } from "./session"
import { createMockRequest } from "../../../../test/support/architect"

describe("session", () => {
  // note process.env.SESSION_SECRET just avois some warnings
  beforeAll(() => (process.env.SESSION_SECRET = "session secretish"))
  afterAll(() => delete process.env.SESSION_SECRET)

  it("should require http.async session on request", async () => {
    const req = createMockRequest()
    expect(await addRequestSessionID(req)).toHaveProperty("statusCode", 500)
  })

  it("add a session-id if not exists", async () => {
    const req = createMockRequest()
    req.session = {}
    await addRequestSessionID(req)
    expect(req).toHaveProperty("session")
    expect(req.session).toHaveProperty(SESSION_ID_KEY)
    const id = req.session[SESSION_ID_KEY]
    expect(typeof id).toStrictEqual("string")
    expect(id.length).toBeGreaterThan(10)
  })

  it("should reuse existing session-id if it exists", async () => {
    // create a session with SESSION_ID_HEADER_NAME:
    const req = createMockRequest()
    req.session = {}
    await addRequestSessionID(req)
    expect(req).toHaveProperty("session")
    const session1 = req.session[SESSION_ID_KEY]
    // now call it again and make sure it doesn't replace it:
    await addRequestSessionID(req)
    const session2 = req.session[SESSION_ID_KEY]
    expect(session1).toEqual(session2)
  })
})
