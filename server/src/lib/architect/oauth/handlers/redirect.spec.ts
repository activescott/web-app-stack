import { randomBytes } from "crypto"
import { createMockRequest } from "../../../../../test/support/architect"
import { ArchitectHttpRequestPayload } from "../../../../types/http"
import { createCSRFToken } from "../../middleware/csrf"
import { addRequestSessionID, readSessionID } from "../../middleware/session"
import { tokenRepositoryFactory } from "../repository/TokenRepository"
import userRepositoryFactory from "../repository/UserRepository"
import oAuthRedirectHandlerFactory from "./redirect"
import * as jwt from "node-webtokens"
import { randomEmail } from "../../../../../test/support"
import sinon from "sinon"

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
      const oauthRedirectHandler = oAuthRedirectHandlerFactory(
        mockFetchJson(),
        await userRepositoryFactory(),
        await tokenRepositoryFactory()
      )
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
          mockFetchJson(),
          await userRepositoryFactory(),
          await tokenRepositoryFactory()
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
      const oauthRedirectHandler = oAuthRedirectHandlerFactory(
        mockFetchJson(),
        await userRepositoryFactory(),
        await tokenRepositoryFactory()
      )
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
      const oauthRedirectHandler = oAuthRedirectHandlerFactory(
        mockFetchJson(),
        await userRepositoryFactory(),
        await tokenRepositoryFactory()
      )
      const req = await mockAuthorizationCodeResponseRequest()

      req.queryStringParameters.provider = PROVIDER_NAME
      mockProviderConfigInEnvironment()

      req.queryStringParameters.state = "bogus"
      const res = await oauthRedirectHandler(req)
      expect(res).toHaveProperty("statusCode", 401)
      expect(res).toHaveProperty("html", expect.stringContaining("Error"))
      expect(res).toHaveProperty(
        "html",
        expect.stringContaining("state is not valid")
      )
    })
  })

  it("should request access/refresh token from token endpoint", async () => {
    // see https://tools.ietf.org/html/rfc6749#section-4.1.3
    const req = await mockAuthorizationCodeResponseRequest()
    req.queryStringParameters.provider = PROVIDER_NAME

    mockProviderConfigInEnvironment()

    // setup mocks:
    const fetchJson = mockFetchJson()
    const oauthRedirectHandler = oAuthRedirectHandlerFactory(
      fetchJson,
      await userRepositoryFactory(),
      await tokenRepositoryFactory()
    )

    // invoke handler
    const res = await oauthRedirectHandler(req)
    expect(res).toHaveProperty("statusCode", 302)
    expect(res).toHaveProperty("headers.location", "/")

    expect(fetchJson).toHaveBeenCalled()
    /* eslint-disable @typescript-eslint/no-explicit-any */
    const args: any[] = fetchJson.mock.calls[0] as any[]
    const urlArg = args[0]
    /* eslint-enable @typescript-eslint/no-explicit-any */
    const url = new URL(urlArg, "https://fake.base")
    expect(url.searchParams.get("grant_type")).toEqual("authorization_code")
    expect(url.searchParams.get("code")).toEqual(expect.stringMatching(/\d+/))
    expect(url.searchParams.has("redirect_uri")).toBeTruthy()
    expect(url.searchParams.has("client_id")).toBeTruthy()
    expect(url.searchParams.has("client_secret")).toBeTruthy()
  })

  it("should create a new user", async () => {
    const req = await mockAuthorizationCodeResponseRequest()
    req.queryStringParameters.provider = PROVIDER_NAME

    mockProviderConfigInEnvironment()

    // setup mocks:
    const userRepo = await userRepositoryFactory()
    const tokenRepo = await tokenRepositoryFactory()
    const email = randomEmail()
    const fetchJson = mockFetchJsonWithEmail(email)
    const oauthRedirectHandler = oAuthRedirectHandlerFactory(
      fetchJson,
      userRepo,
      tokenRepo
    )

    // invoke handler
    await oauthRedirectHandler(req)
    await expect(userRepo.getFromEmail(email)).resolves.toHaveProperty(
      "email",
      email
    )
  })

  it("should NOT create a user that already exists (by email address)", async () => {
    const req = await mockAuthorizationCodeResponseRequest()
    req.queryStringParameters.provider = PROVIDER_NAME

    mockProviderConfigInEnvironment()

    // setup mocks:
    const tokenRepo = await tokenRepositoryFactory()
    const userRepo = await userRepositoryFactory()
    const email = randomEmail()
    // now create the user in the user repo so that we can ensure it isn't re-created:
    await userRepo.add({ email })

    // now make sure no more suers are added:
    const userRepoMock = sinon.mock(userRepo)
    userRepoMock.expects("add").never()

    const fetchJson = mockFetchJsonWithEmail(email)
    const oauthRedirectHandler = oAuthRedirectHandlerFactory(
      fetchJson,
      userRepo,
      tokenRepo
    )

    // invoke handler
    await oauthRedirectHandler(req)
    userRepoMock.verify()
  })

  it("should save access/refresh token into DB", async () => {
    const req = await mockAuthorizationCodeResponseRequest()
    req.queryStringParameters.provider = PROVIDER_NAME

    mockProviderConfigInEnvironment()

    // setup mocks:
    const userRepo = await userRepositoryFactory()
    const tokenRepo = await tokenRepositoryFactory()
    const email = randomEmail()
    const fetchJson = mockFetchJsonWithEmail(email)
    const oauthRedirectHandler = oAuthRedirectHandlerFactory(
      fetchJson,
      userRepo,
      tokenRepo
    )

    const tokenRepoUpsert = sinon.spy(tokenRepo, "upsert")

    // invoke handler
    await oauthRedirectHandler(req)

    // NOTE: could mock the userRepo and just return a new user with an ID, to not need a functioning userRepo, but this works for now.
    const newUser = await userRepo.getFromEmail(email)

    expect(tokenRepoUpsert.callCount).toEqual(1)
    const actualToken = tokenRepoUpsert.firstCall.args[0]
    expect(actualToken).toHaveProperty("provider", PROVIDER_NAME)
    expect(actualToken).toHaveProperty("userID", newUser.id)
    expect(actualToken).toHaveProperty("expires_at", expect.anything())
    expect(actualToken).toHaveProperty("access_token", expect.anything())
    expect(actualToken).toHaveProperty("refresh_token", expect.anything())
    expect(actualToken.expires_at).toBeGreaterThan(Date.now())
  })

  it.todo(
    "should write cookie, session-key, or header (which one?) to indicate the user is indeed logged in"
  )

  it.todo(
    "should redirect the user to the after-login redirect page in query params"
  )

  it("should redirect the user to the default after-login redirect page", async () => {
    const oauthRedirectHandler = oAuthRedirectHandlerFactory(
      mockFetchJson(),
      await userRepositoryFactory(),
      await tokenRepositoryFactory()
    )
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

function createIDToken(email: string = "foo@bar.com"): string {
  const key = randomBytes(32)
  return jwt.generate("HS256", { sub: email, email: email }, key)
}

type TokenResponse = {
  access_token: string
  expires_in: number
  refresh_token: string
  id_token: string
}

/* eslint-disable @typescript-eslint/no-explicit-any */
function mockFetchJsonWithEmail(email: string): jest.Mock<Promise<any>> {
  /* eslint-enable @typescript-eslint/no-explicit-any */
  return mockFetchJson({
    access_token: "foo-access",
    expires_in: 3600,
    refresh_token: "foo-refresh",
    id_token: createIDToken(email),
  })
}

/* eslint-disable @typescript-eslint/no-explicit-any */
function mockFetchJson(
  fetchResult: TokenResponse = {
    access_token: "foo-access",
    expires_in: 3600,
    refresh_token: "foo-refresh",
    id_token: createIDToken(),
  }
): jest.Mock<Promise<any>> {
  const fetchJson = jest.fn(async () => {
    return fetchResult
  })
  jest.doMock("../../../fetch", () => {
    fetchJson
  })
  return fetchJson
}
/* eslint-enable @typescript-eslint/no-explicit-any */

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
