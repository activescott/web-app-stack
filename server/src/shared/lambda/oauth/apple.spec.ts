import { appleSecret } from "./apple"

const APPLE_TEST_KEY = `-----BEGIN EC PRIVATE KEY-----
MHcCAQEEIKsqu3EEoLbVnrv15zNx+KhjdUgoXhSvXmRON5H5aKB2oAoGCCqGSM49
AwEHoUQDQgAEAopbqqW7FTpow1J/03yo1rNdfCunyI9UMmYmKY1D7WrNbCXF2E7B
eMIsSWXd+BFJzY2+vE+J6aQtGAy8XeJBLQ==
-----END EC PRIVATE KEY-----
`
const teamID = "ABCDEFGHIJ"
const clientID = "com.test.foo-service-id"
const keyID = "LMNOPQRSTU"
const privateKey = APPLE_TEST_KEY

describe("apple", () => {
  it("should return a valid jwt", () => {
    const secret = appleSecret(teamID, clientID, keyID, privateKey)

    expect(secret).toBeTruthy()
    expect(typeof secret).toEqual("string")
    expect(secret.length).toBeGreaterThan(10)
    // jwts have three parts split by period:
    const parts = secret.split(".")
    expect(parts).toHaveLength(3)
  })

  it("should reject invalid args", () => {
    expect(() => appleSecret(teamID, clientID, "", privateKey)).toThrowError()
    expect(() => appleSecret(teamID, clientID, keyID, "")).toThrowError()
  })
})
