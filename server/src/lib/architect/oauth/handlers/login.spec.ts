import { createMockRequest } from "../../../../../test/support/architect"
import { addRequestSessionID } from "../../middleware/session"
import login from "./login"

describe("login handler", () => {
  // preserve environment
  const OLD_ENV = process.env
  afterAll(() => {
    process.env = OLD_ENV
  })

  afterEach(() => {
    process.env = OLD_ENV
  })

  it("should fail if no provider is in query string", async () => {
    const req = createMockRequest()
    // NOTE: no query string for provider
    const res = await login(req)
    expect(res).toHaveProperty("statusCode", 400)
    expect(res).toHaveProperty(
      "json.message",
      expect.stringMatching(/provider/)
    )
  })

  it("should ensure environment variables: ClientID", async () => {
    const req = createMockRequest()
    req.queryStringParameters["provider"] = "GOO"

    // note no environment variable for Client ID, Client Secret in
    const res = await login(req)
    expect(res).toHaveProperty("statusCode", 400)
    expect(res).toHaveProperty(
      "json.message",
      expect.stringMatching(/OAUTH_GOO_CLIENT_ID/)
    )
  })

  it("should ensure environment variables: Client ID, Client Secret", async () => {
    const req = createMockRequest()
    req.queryStringParameters["provider"] = "GOO"

    // NOTE: environment variable for Client ID, but not Client Secret
    process.env.OAUTH_GOO_CLIENT_ID = "googcid"
    const res = await login(req)
    expect(res).toHaveProperty("statusCode", 400)
    expect(res).toHaveProperty(
      "json.message",
      expect.stringMatching(/AUTH_GOO_CLIENT_SECRET/)
    )
  })

  it("should ensure environment variables: Client ID, Client Secret, Auth Endpoint", async () => {
    const req = createMockRequest()
    req.queryStringParameters["provider"] = "GOO"

    // NOTE: environment variable for Client ID, but not Client Secret
    process.env.OAUTH_GOO_CLIENT_ID = "googcid"
    process.env.OAUTH_GOO_CLIENT_SECRET = "googsec"
    const res = await login(req)
    expect(res).toHaveProperty("statusCode", 400)
    expect(res).toHaveProperty(
      "json.message",
      expect.stringMatching(/AUTH_GOO_ENDPOINT_AUTH/)
    )
  })

  it("should ensure environment variables: Client ID, Client Secret, Auth Endpoint, Token Endpoint", async () => {
    const req = createMockRequest()
    req.queryStringParameters["provider"] = "GOO"

    // NOTE: environment variable for Client ID, but not Client Secret
    process.env.OAUTH_GOO_CLIENT_ID = "googcid"
    process.env.OAUTH_GOO_CLIENT_SECRET = "googsec"
    process.env.OAUTH_GOO_ENDPOINT_AUTH = "https://goo.foo/auth"
    const res = await login(req)
    expect(res).toHaveProperty("statusCode", 400)
    expect(res).toHaveProperty(
      "json.message",
      expect.stringMatching(/AUTH_GOO_ENDPOINT_TOKEN/)
    )
  })

  it("should redirect", async () => {
    const req = createMockRequest()
    
    // to properly create a state token, the handler needs a session id
    await addRequestSessionID(req)
    req.queryStringParameters["provider"] = "GOO"

    process.env.OAUTH_GOO_CLIENT_ID = "googcid"
    process.env.OAUTH_GOO_CLIENT_SECRET = "googsec"
    process.env.OAUTH_GOO_ENDPOINT_AUTH = "https://goo.foo/auth"
    process.env.OAUTH_GOO_ENDPOINT_TOKEN = "https://goo.foo/tok"
    process.env.OAUTH_GOO_REDIRECT_URL = "https://mysite/auth/redir/goo"
    const res = await login(req)
    expect(res).toHaveProperty("statusCode", 302)
    expect(res).toHaveProperty("headers.location")
    const location = new URL(res.headers.location)
    expect(location.searchParams.get("response_type")).toEqual("code")
    expect(location.searchParams.get("scope")).toEqual("profile email")
    expect(location.searchParams.get("client_id")).toEqual(process.env.OAUTH_GOO_CLIENT_ID)
    expect(location.searchParams.get("redirect_uri")).toEqual(process.env.OAUTH_GOO_REDIRECT_URL)
    expect(location.searchParams.has("state")).toBeTruthy()
  })
})
