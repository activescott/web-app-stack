import { createMockRequest } from "../../../../../test/support/lambda"
import loginHandlerFactory from "./login"
import { URL } from "url"
import assert from "assert"
import { LambdaHttpRequest } from "../../../lambda"
import { expectSession } from "../../../../../test/support"
import userRepositoryFactory from "../repository/UserRepository"

describe("login handler", () => {
  // preserve environment
  const OLD_ENV = process.env
  afterAll(() => {
    process.env = OLD_ENV
  })

  afterEach(() => {
    process.env = OLD_ENV
  })

  it("should fail if no provider is in path param string", async () => {
    const login = loginHandlerFactory(userRepositoryFactory())
    const req = createMockLoginRequest()
    req.pathParameters = {}
    // NOTE: no query string for provider
    const res = await login(req)
    expect(res).toHaveProperty("statusCode", 400)
    expect(res).toHaveProperty(
      "body",
      expect.stringMatching(/provider .*must be specified/)
    )
  })

  describe("configuration", () => {
    it("should ensure environment variables: ClientID", async () => {
      const login = loginHandlerFactory(userRepositoryFactory())
      const req = createMockLoginRequest()

      // note no environment variable for Client ID, Client Secret in
      const res = await login(req)
      expect(res).toHaveProperty("statusCode", 500)
      expect(res).toHaveProperty(
        "body",
        expect.stringMatching(/OAUTH_GOO_CLIENT_ID/)
      )
    })

    it("should ensure environment variables: Client ID, Client Secret", async () => {
      const req = createMockLoginRequest()
      const login = loginHandlerFactory(userRepositoryFactory())

      // NOTE: environment variable for Client ID, but not Client Secret
      process.env.OAUTH_GOO_CLIENT_ID = "googcid"
      const res = await login(req)
      expect(res).toHaveProperty("statusCode", 500)
      expect(res).toHaveProperty(
        "body",
        expect.stringMatching(/AUTH_GOO_CLIENT_SECRET/)
      )
    })

    it("should ensure environment variables: Client ID, Client Secret, Auth Endpoint", async () => {
      const req = createMockLoginRequest()
      const login = loginHandlerFactory(userRepositoryFactory())

      // NOTE: environment variable for Client ID, but not Client Secret
      process.env.OAUTH_GOO_CLIENT_ID = "googcid"
      process.env.OAUTH_GOO_CLIENT_SECRET = "googsec"
      const res = await login(req)
      expect(res).toHaveProperty("statusCode", 500)
      expect(res).toHaveProperty(
        "body",
        expect.stringMatching(/AUTH_GOO_ENDPOINT_AUTH/)
      )
    })

    it("should ensure environment variables: Client ID, Client Secret, Auth Endpoint, Token Endpoint", async () => {
      const req = createMockLoginRequest()
      const login = loginHandlerFactory(userRepositoryFactory())

      // NOTE: environment variable for Client ID, but not Client Secret
      process.env.OAUTH_GOO_CLIENT_ID = "googcid"
      process.env.OAUTH_GOO_CLIENT_SECRET = "googsec"
      process.env.OAUTH_GOO_ENDPOINT_AUTH = "https://goo.foo/auth"
      const res = await login(req)
      expect(res).toHaveProperty("statusCode", 500)
      expect(res).toHaveProperty(
        "body",
        expect.stringMatching(/AUTH_GOO_ENDPOINT_TOKEN/)
      )
    })

    describe("apple", () => {
      const APPLE_TEST_KEY = `-----BEGIN EC PRIVATE KEY-----
MHcCAQEEIKsqu3EEoLbVnrv15zNx+KhjdUgoXhSvXmRON5H5aKB2oAoGCCqGSM49
AwEHoUQDQgAEAopbqqW7FTpow1J/03yo1rNdfCunyI9UMmYmKY1D7WrNbCXF2E7B
eMIsSWXd+BFJzY2+vE+J6aQtGAy8XeJBLQ==
-----END EC PRIVATE KEY-----
`
      it("should require apple-specific config", async () => {
        const req = createMockLoginRequest()
        const login = loginHandlerFactory(userRepositoryFactory())

        // NOTE: environment variable for Client ID, but not Client Secret
        process.env.OAUTH_GOO_CLIENT_ID = "cid"
        process.env.OAUTH_GOO_ENDPOINT_AUTH = "sec"
        process.env.OAUTH_GOO_ENDPOINT_REDIRECT = "https://goo.foo/redir"
        // impl note: This token endpoint value is what triggers impl to look for Apple-specific config
        process.env.OAUTH_GOO_ENDPOINT_TOKEN =
          "https://appleid.apple.com/auth/token"
        const res = await login(req)
        expect(res).toHaveProperty("statusCode", 500)
        const expectedConfigs = [
          "OAUTH_GOO_APPLE_TEAM_ID",
          "OAUTH_GOO_APPLE_KEY_ID",
          "OAUTH_GOO_APPLE_PRIVATE_KEY",
          "OAUTH_GOO_RESPONSE_MODE",
        ]
        expectedConfigs.forEach((cname) =>
          expect(res).toHaveProperty(
            "body",
            expect.stringMatching(new RegExp(cname))
          )
        )
      })

      it("should succeed with valid Apple Config", async () => {
        const req = createMockLoginRequest()
        const login = loginHandlerFactory(userRepositoryFactory())

        process.env.OAUTH_GOO_CLIENT_ID = "cid"
        process.env.OAUTH_GOO_ENDPOINT_AUTH =
          "https://appleid.apple.com/auth/authorize"
        process.env.OAUTH_GOO_ENDPOINT_REDIRECT = "https://goo.foo/redir"
        // impl note: This token endpoint value is what triggers impl to look for Apple-specific config
        process.env.OAUTH_GOO_ENDPOINT_TOKEN =
          "https://appleid.apple.com/auth/token"
        process.env.OAUTH_GOO_APPLE_TEAM_ID = "test-team-id"
        process.env.OAUTH_GOO_APPLE_KEY_ID = "test-key-id"
        process.env.OAUTH_GOO_APPLE_PRIVATE_KEY = APPLE_TEST_KEY
        process.env.OAUTH_GOO_RESPONSE_MODE = "form_post"

        const res = await login(req)
        expect(res).toHaveProperty("statusCode", 302)
      })
    })

    it("should reject invalid URL for Auth Endpoint", async () => {
      const req = createMockLoginRequest()
      const login = loginHandlerFactory(userRepositoryFactory())

      process.env.OAUTH_GOO_CLIENT_ID = "googcid"
      process.env.OAUTH_GOO_CLIENT_SECRET = "googsec"
      process.env.OAUTH_GOO_ENDPOINT_AUTH = "invalid-url"
      process.env.OAUTH_GOO_ENDPOINT_TOKEN = "https://goo.foo/tok"
      process.env.OAUTH_GOO_ENDPOINT_REDIRECT = "https://mysite/auth/redir/goo"
      const res = await login(req)
      expect(res).toHaveProperty("statusCode", 500)
      expect(res).toHaveProperty(
        "body",
        expect.stringMatching(/OAUTH_GOO_ENDPOINT_AUTH/)
      )
    })
  })

  it("should redirect", async () => {
    const req = createMockLoginRequest()
    const login = loginHandlerFactory(userRepositoryFactory())

    process.env.OAUTH_GOO_CLIENT_ID = "googcid"
    process.env.OAUTH_GOO_CLIENT_SECRET = "googsec"
    process.env.OAUTH_GOO_ENDPOINT_AUTH = "https://goo.foo/auth"
    process.env.OAUTH_GOO_ENDPOINT_TOKEN = "https://goo.foo/tok"
    process.env.OAUTH_GOO_ENDPOINT_REDIRECT = "https://mysite/auth/redir/goo"
    const res = await login(req)
    expect(res).toHaveProperty("statusCode", 302)
    expect(res).toHaveProperty("headers.location")
    assert(res.headers)
    const location = new URL(res.headers.location as string)
    expect(location.searchParams.get("response_type")).toEqual("code")
    expect(location.searchParams.get("scope")?.split(" ")).toContain("openid")
    expect(location.searchParams.get("scope")?.split(" ")).toContain("email")
    expect(location.searchParams.get("client_id")).toEqual(
      process.env.OAUTH_GOO_CLIENT_ID
    )
    expect(location.searchParams.get("redirect_uri")).toEqual(
      process.env.OAUTH_GOO_ENDPOINT_REDIRECT
    )
    expect(location.searchParams.has("state")).toBeTruthy()
  })

  it("should redirect with configured scope", async () => {
    const req = createMockLoginRequest()
    const login = loginHandlerFactory(userRepositoryFactory())

    process.env.OAUTH_GOO_CLIENT_ID = "googcid"
    process.env.OAUTH_GOO_CLIENT_SECRET = "googsec"
    process.env.OAUTH_GOO_ENDPOINT_AUTH = "https://goo.foo/auth"
    process.env.OAUTH_GOO_ENDPOINT_TOKEN = "https://goo.foo/tok"
    process.env.OAUTH_GOO_ENDPOINT_REDIRECT = "https://mysite/auth/redir/goo"
    process.env.OAUTH_GOO_SCOPE = "foo bar"
    const res = await login(req)
    expect(res).toHaveProperty("statusCode", 302)
    expect(res).toHaveProperty("headers.location")
    assert(res.headers)
    const location = new URL(res.headers.location as string)
    expect(location.searchParams.get("scope")?.split(" ")).toContain("foo")
    expect(location.searchParams.get("scope")?.split(" ")).toContain("bar")
  })

  it("should create a browser session", async () => {
    const req = createMockLoginRequest()
    const login = loginHandlerFactory(userRepositoryFactory())

    process.env.OAUTH_GOO_CLIENT_ID = "googcid"
    process.env.OAUTH_GOO_CLIENT_SECRET = "googsec"
    process.env.OAUTH_GOO_ENDPOINT_AUTH = "https://goo.foo/auth"
    process.env.OAUTH_GOO_ENDPOINT_TOKEN = "https://goo.foo/tok"
    process.env.OAUTH_GOO_ENDPOINT_REDIRECT = "https://mysite/auth/redir/goo"
    const res = await login(req)

    expect(res).toHaveProperty("statusCode", 302)
    // make sure it created a session
    expectSession(res)
  })
})

function createMockLoginRequest(): LambdaHttpRequest {
  const PROVIDER_NAME = "GOO"
  const req = createMockRequest()
  // we expect a path param that specifies the provider name:
  req.pathParameters = {
    provider: PROVIDER_NAME,
  }
  return req
}
