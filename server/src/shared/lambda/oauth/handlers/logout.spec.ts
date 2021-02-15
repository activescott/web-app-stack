import { expectSession } from "../../../../../test/support"
import { createMockRequest } from "../../../../../test/support/lambda"
import logoutHandlerFactory from "./logout"

it("should redirect", async () => {
  const req = createMockRequest()
  const handler = logoutHandlerFactory()

  const res = await handler(req)
  expect(res).toHaveProperty("statusCode", 302)
})

it("should create a browser session", async () => {
  const req = createMockRequest()
  const handler = logoutHandlerFactory()

  const res = await handler(req)

  expect(res).toHaveProperty("statusCode", 302)
  // make sure it created a session
  expectSession(res)
})
