import { createMockRequest } from "../../../../../test/support/architect"
import { ArchitectHttpRequestPayload } from "../../../../types/http"
import { createCSRFToken } from "../../middleware/csrf"
import { addRequestSessionID, readSessionID } from "../../middleware/session"
import oAuthRedirectHandlerFactory from "./redirect"

// note to self: Jest's auto-mocking voodoo wastes more time than it saves. Just inject dependencies (e.g. w/ oAuthRedirectHandlerFactory)

const PROVIDER_NAME = "GOO"

// preserve environment
const OLD_ENV = process.env
afterAll(() => {
  process.env = OLD_ENV
})

afterEach(() => {
  process.env = OLD_ENV
})

beforeEach(() => {
  // as we're mocking fetch below
  jest.resetModules()
})

describe("redirect", () => {
  describe("Authorization Server Error", () => {
    // see https://tools.ietf.org/html/rfc6749#section-4.1.2.1
    it("should display an error if auth server provided unknown/any error query param", async () => {
      const oauthRedirectHandler = oAuthRedirectHandlerFactory(mockFetchJson())
      const req = await mockAuthorizationCodeResponseRequest()
      req.queryStringParameters.error = "unknown"
      const res = await oauthRedirectHandler(req)
      expect(res).toHaveProperty("statusCode", 500)
      expect(res).toHaveProperty("html", expect.stringContaining("Error"))
    })

    it.each([["unauthorized_client"], ["access_denied"]])(
      "should handle unauthorized: %s",
      async (errorCode) => {
        const oauthRedirectHandler = oAuthRedirectHandlerFactory(
          mockFetchJson()
        )
        const req = await mockAuthorizationCodeResponseRequest()
        req.queryStringParameters.error = errorCode
        const res = await oauthRedirectHandler(req)
        expect(res).toHaveProperty("statusCode", 401)
        expect(res).toHaveProperty("html", expect.stringContaining("Error"))
      }
    )

    it.todo("should display the error in error_description?")
  })

  // see https://tools.ietf.org/html/rfc6749#section-10.12 and https://tools.ietf.org/html/rfc7636#section-1 (we don't implement PKCE yet but CSRF state mitigates the attacks)
  describe("state token", () => {
    it("should reject missing state", async () => {
      const oauthRedirectHandler = oAuthRedirectHandlerFactory(mockFetchJson())
      const req = await mockAuthorizationCodeResponseRequest()

      req.queryStringParameters.provider = PROVIDER_NAME
      mockProviderConfigInEnvironment()

      delete req.queryStringParameters.state
      const res = await oauthRedirectHandler(req)

      expect(res).toHaveProperty("statusCode", 401)
      expect(res).toHaveProperty("html", expect.stringContaining("Error"))
      expect(res).toHaveProperty(
        "html",
        expect.stringContaining("state is not present")
      )
    })

    it("should reject invalid state", async () => {
      const oauthRedirectHandler = oAuthRedirectHandlerFactory(mockFetchJson())
      const req = await mockAuthorizationCodeResponseRequest()

      req.queryStringParameters.provider = PROVIDER_NAME
      mockProviderConfigInEnvironment()

      req.queryStringParameters.state = "bogus"
      const res = await oauthRedirectHandler(req)
      console.log({ res })
      expect(res).toHaveProperty("statusCode", 401)
      expect(res).toHaveProperty("html", expect.stringContaining("Error"))
      expect(res).toHaveProperty(
        "html",
        expect.stringContaining("state is not valid")
      )
    })
  })

  it.todo("should call API to ensure valid access token?")

  it.todo("should save access/refresh token into DB")

  it.todo(
    "should write cookie, session-key, or header (which one?) to indicate the user is indeed logged in"
  )

  it.todo(
    "should redirect the user to the after-login redirect page in query params"
  )

  it("should request access/refresh token from token endpoint", async () => {
    // see https://tools.ietf.org/html/rfc6749#section-4.1.3

    const req = await mockAuthorizationCodeResponseRequest()

    req.queryStringParameters.provider = PROVIDER_NAME
    mockProviderConfigInEnvironment()

    // setup mocks:
    const fetchJson = mockFetchJson()
    const oauthRedirectHandler = oAuthRedirectHandlerFactory(fetchJson)

    // invoke handler
    let res = await oauthRedirectHandler(req)
    console.log({ res })
    expect(res).toHaveProperty("statusCode", 302)
    expect(res).toHaveProperty("headers.location", "/")

    // TODO: make sure it called things correctly!
    expect(fetchJson).toHaveBeenCalled()
    const args: any[] = fetchJson.mock.calls[0] as any[]
    const urlArg = args[0]
    const url = new URL(urlArg, "https://fake.base")
    expect(url.searchParams.get("grant_type")).toEqual("authorization_code")
    expect(url.searchParams.get("code")).toEqual(expect.stringMatching(/\d+/))
    expect(url.searchParams.has("redirect_uri")).toBeTruthy()
    expect(url.searchParams.has("client_id")).toBeTruthy()
    expect(url.searchParams.has("client_secret")).toBeTruthy()
  })

  it("should redirect the user to the default after-login redirect page", async () => {
    const oauthRedirectHandler = oAuthRedirectHandlerFactory(mockFetchJson())
    const req = await mockAuthorizationCodeResponseRequest()

    req.queryStringParameters.provider = PROVIDER_NAME
    mockProviderConfigInEnvironment()

    // invoke handler for production (root)
    let res = await oauthRedirectHandler(req)
    expect(res).toHaveProperty("statusCode", 302)
    expect(res).toHaveProperty("headers.location", "/")

    // invoke handler for staging (/staging)
    process.env.NODE_ENV = "staging"
    res = await oauthRedirectHandler(req)
    expect(res).toHaveProperty("statusCode", 302)
    expect(res).toHaveProperty("headers.location", "/staging")
  })
})

/**
 * Mocks out a request to the app from the authorization server
 */
async function mockAuthorizationCodeResponseRequest(): Promise<ArchitectHttpRequestPayload> {
  const req = createMockRequest()
  // because for state validation we need a session ID
  await addRequestSessionID(req)
  const sessionID = readSessionID(req)
  const csrfToken = await createCSRFToken(sessionID)

  // add success required query params
  req.queryStringParameters.code = Math.floor(
    Math.random() * Math.floor(Number.MAX_SAFE_INTEGER)
  ).toString()
  req.queryStringParameters.state = csrfToken
  return req
}

function mockFetchJson(fetchResult: any = {}) {
  const fetchJson: jest.MockedFunction<() => any> = jest.fn(async () => {
    return fetchResult
  })
  jest.doMock("../../../fetch", () => {
    fetchJson
  })
  return fetchJson
}

function mockProviderConfigInEnvironment(providerName = PROVIDER_NAME): void {
  process.env[`OAUTH_${providerName}_CLIENT_ID`] = "googcid"
  process.env[`OAUTH_${providerName}_CLIENT_SECRET`] = "googsec"
  process.env[
    `OAUTH_${providerName}_ENDPOINT_AUTH`
  ] = `https://${providerName}.fake/auth`
  process.env[
    `OAUTH_${providerName}_ENDPOINT_TOKEN`
  ] = `https://${providerName}.fake/tok`
  process.env[`OAUTH_${providerName}_REDIRECT_URL`] =
    "https://mysite/auth/redir/goo"
}
