import { createMockRequest } from "../../../../../test/support/architect"
import { readSessionID } from "../../middleware/session"
import login from "./login"
import { URL } from "url"
import assert from "assert"
import { HttpRequest } from "@architect/functions"

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
    const req = createMockLoginRequest()
    req.pathParameters = {}
    // NOTE: no query string for provider
    const res = await login(req)
    expect(res).toHaveProperty("statusCode", 400)
    expect(res).toHaveProperty(
      "html",
      expect.stringMatching(/provider .*must be specified/)
    )
  })

  describe("configuration", () => {
    it("should ensure environment variables: ClientID", async () => {
      const req = createMockLoginRequest()
      req.queryStringParameters["provider"] = "GOO"

      // note no environment variable for Client ID, Client Secret in
      const res = await login(req)
      expect(res).toHaveProperty("statusCode", 400)
      expect(res).toHaveProperty(
        "html",
        expect.stringMatching(/OAUTH_GOO_CLIENT_ID/)
      )
    })

    it("should ensure environment variables: Client ID, Client Secret", async () => {
      const req = createMockLoginRequest()
      req.queryStringParameters["provider"] = "GOO"

      // NOTE: environment variable for Client ID, but not Client Secret
      process.env.OAUTH_GOO_CLIENT_ID = "googcid"
      const res = await login(req)
      expect(res).toHaveProperty("statusCode", 400)
      expect(res).toHaveProperty(
        "html",
        expect.stringMatching(/AUTH_GOO_CLIENT_SECRET/)
      )
    })

    it("should ensure environment variables: Client ID, Client Secret, Auth Endpoint", async () => {
      const req = createMockLoginRequest()
      req.queryStringParameters["provider"] = "GOO"

      // NOTE: environment variable for Client ID, but not Client Secret
      process.env.OAUTH_GOO_CLIENT_ID = "googcid"
      process.env.OAUTH_GOO_CLIENT_SECRET = "googsec"
      const res = await login(req)
      expect(res).toHaveProperty("statusCode", 400)
      expect(res).toHaveProperty(
        "html",
        expect.stringMatching(/AUTH_GOO_ENDPOINT_AUTH/)
      )
    })

    it("should ensure environment variables: Client ID, Client Secret, Auth Endpoint, Token Endpoint", async () => {
      const req = createMockLoginRequest()
      req.queryStringParameters["provider"] = "GOO"

      // NOTE: environment variable for Client ID, but not Client Secret
      process.env.OAUTH_GOO_CLIENT_ID = "googcid"
      process.env.OAUTH_GOO_CLIENT_SECRET = "googsec"
      process.env.OAUTH_GOO_ENDPOINT_AUTH = "https://goo.foo/auth"
      const res = await login(req)
      expect(res).toHaveProperty("statusCode", 400)
      expect(res).toHaveProperty(
        "html",
        expect.stringMatching(/AUTH_GOO_ENDPOINT_TOKEN/)
      )
    })
  })

  it("should redirect", async () => {
    const req = createMockLoginRequest()

    process.env.OAUTH_GOO_CLIENT_ID = "googcid"
    process.env.OAUTH_GOO_CLIENT_SECRET = "googsec"
    process.env.OAUTH_GOO_ENDPOINT_AUTH = "https://goo.foo/auth"
    process.env.OAUTH_GOO_ENDPOINT_TOKEN = "https://goo.foo/tok"
    process.env.OAUTH_GOO_ENDPOINT_REDIRECT = "https://mysite/auth/redir/goo"
    const res = await login(req)
    expect(res).toHaveProperty("statusCode", 302)
    expect(res).toHaveProperty("headers.location")
    assert(res.headers)
    const location = new URL(res.headers.location)
    expect(location.searchParams.get("response_type")).toEqual("code")
    expect(location.searchParams.get("scope")?.split(" ")).toContain("openid")
    expect(location.searchParams.get("client_id")).toEqual(
      process.env.OAUTH_GOO_CLIENT_ID
    )
    expect(location.searchParams.get("redirect_uri")).toEqual(
      process.env.OAUTH_GOO_ENDPOINT_REDIRECT
    )
    expect(location.searchParams.has("state")).toBeTruthy()
  })

  it("should create a browser session", async () => {
    const req = createMockLoginRequest()

    process.env.OAUTH_GOO_CLIENT_ID = "googcid"
    process.env.OAUTH_GOO_CLIENT_SECRET = "googsec"
    process.env.OAUTH_GOO_ENDPOINT_AUTH = "https://goo.foo/auth"
    process.env.OAUTH_GOO_ENDPOINT_TOKEN = "https://goo.foo/tok"
    process.env.OAUTH_GOO_ENDPOINT_REDIRECT = "https://mysite/auth/redir/goo"
    const res = await login(req)

    // make sure it created a session
    expect(res).toHaveProperty("statusCode", 302)
    const foundSession = readSessionID(res)
    expect(typeof foundSession).toStrictEqual("string")
    expect(foundSession.length).toBeGreaterThan(0)
  })
})

function createMockLoginRequest(): HttpRequest {
  const PROVIDER_NAME = "GOO"
  const req = createMockRequest()
  // we expect a path param that specifies the provider name:
  req.pathParameters = {
    provider: PROVIDER_NAME,
  }
  return req
}
