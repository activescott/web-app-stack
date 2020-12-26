/// <reference types="jest" />
import { createToken } from "./csrf"

it("should create a token", async () => {
  const tok = await createToken()
  expect(typeof tok).toBe("string")
  expect(tok.length).toBeGreaterThan(10)
})
