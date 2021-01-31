import { randomBytes } from "crypto"
import { createMockRequest } from "../../../../../test/support/lambda"
import { createCSRFToken } from "../../middleware/csrf"
import {
  createAnonymousSessionID,
  injectSessionToRequest,
  readSessionID,
} from "../../middleware/session"
import identityRepositoryFactory, {
  StoredIdentityProposal,
} from "../repository/IdentityRepository"
import userRepositoryFactory, { StoredUser } from "../repository/UserRepository"
import oAuthRedirectHandlerFactory from "./redirect"
import * as jwt from "node-webtokens"
import {
  expectSession,
  randomEmail,
  randomInt,
} from "../../../../../test/support"
import sinon from "sinon"
import { URL, URLSearchParams } from "url"
import assert from "assert"
import { LambdaHttpRequest } from "../../../lambda"
import { APIGatewayProxyEventQueryStringParameters } from "aws-lambda"

// note to self: Jest's auto-mocking voodoo wastes more time than it saves. Just inject dependencies (e.g. w/ oAuthRedirectHandlerFactory)

const PROVIDER_NAME = "GOO"
const PROVIDER_ALTERNATE_NAME = "AAP"

// preserve environment
const OLD_ENV = process.env
afterAll(() => {
  process.env = OLD_ENV
})

afterEach(() => {
  process.env = OLD_ENV
  // as we're mocking fetch below
  jest.resetModules()
})

describe("redirect", () => {
  describe("Authorization Server Error", () => {
    // see https://tools.ietf.org/html/rfc6749#section-4.1.2.1
    it("should display an error if auth server provided unknown/any error query param", async () => {
      const oauthRedirectHandler = oAuthRedirectHandlerFactory(
        mockFetchJson(),
        userRepositoryFactory(),
        identityRepositoryFactory()
      )
      const req = await mockAuthorizationCodeResponseRequest()
      req.queryStringParameters.error = "unknown"
      const res = await oauthRedirectHandler(req)
      expect(res).toHaveProperty("statusCode", 500)
      expect(res).toHaveProperty("body", expect.stringContaining("Error"))
    })

    it.each([["unauthorized_client"], ["access_denied"]])(
      "should handle unauthorized: %s",
      async (errorCode) => {
        const oauthRedirectHandler = oAuthRedirectHandlerFactory(
          mockFetchJson(),
          userRepositoryFactory(),
          identityRepositoryFactory()
        )
        const req = await mockAuthorizationCodeResponseRequest()
        req.queryStringParameters.error = errorCode
        const res = await oauthRedirectHandler(req)
        expect(res).toHaveProperty("statusCode", 401)
        expect(res).toHaveProperty("body", expect.stringContaining("Error"))
      }
    )

    it.todo("should display the error in error_description?")
  })

  // see https://tools.ietf.org/html/rfc6749#section-10.12 and https://tools.ietf.org/html/rfc7636#section-1 (we don't implement PKCE yet but CSRF state mitigates the attacks)
  describe("state token", () => {
    it("should reject missing state", async () => {
      const oauthRedirectHandler = oAuthRedirectHandlerFactory(
        mockFetchJson(),
        userRepositoryFactory(),
        identityRepositoryFactory()
      )
      const req = await mockAuthorizationCodeResponseRequest()

      mockProviderConfigInEnvironment()
      delete req.queryStringParameters.state
      const res = await oauthRedirectHandler(req)

      expect(res).toHaveProperty("statusCode", 401)
      expect(res).toHaveProperty("body", expect.stringContaining("Error"))
      expect(res).toHaveProperty(
        "body",
        expect.stringContaining("state is not present")
      )
    })

    it("should reject invalid state", async () => {
      const oauthRedirectHandler = oAuthRedirectHandlerFactory(
        mockFetchJson(),
        userRepositoryFactory(),
        identityRepositoryFactory()
      )
      const req = await mockAuthorizationCodeResponseRequest()

      mockProviderConfigInEnvironment()

      req.queryStringParameters.state = "bogus"
      const res = await oauthRedirectHandler(req)
      expect(res).toHaveProperty("statusCode", 401)
      expect(res).toHaveProperty("body", expect.stringContaining("Error"))
      expect(res).toHaveProperty(
        "body",
        expect.stringContaining("state is not valid")
      )
    })
  })

  it("should request access/refresh token from token endpoint", async () => {
    // see https://tools.ietf.org/html/rfc6749#section-4.1.3
    const req = await mockAuthorizationCodeResponseRequest()

    mockProviderConfigInEnvironment()

    // setup mocks:
    const fetchJson = mockFetchJson()
    const oauthRedirectHandler = oAuthRedirectHandlerFactory(
      fetchJson,
      userRepositoryFactory(),
      identityRepositoryFactory()
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

    mockProviderConfigInEnvironment()

    // setup mocks:
    const userRepo = userRepositoryFactory()
    const userRepoCreateSpy = sinon.spy(userRepo, "create")

    const identityRepo = identityRepositoryFactory()
    const identityRepoUpsertSpy = sinon.spy(identityRepo, "upsert")

    const email = randomEmail()
    const fetchJson = mockFetchJsonWithEmail(email)
    const oauthRedirectHandler = oAuthRedirectHandlerFactory(
      fetchJson,
      userRepo,
      identityRepo
    )

    // invoke handler
    await oauthRedirectHandler(req)
    expect(userRepoCreateSpy.callCount).toEqual(1)
    expect(identityRepoUpsertSpy.callCount).toEqual(1)

    const upsertArg = identityRepoUpsertSpy.firstCall.firstArg
    expect(upsertArg).toHaveProperty("provider", PROVIDER_NAME)
    expect(upsertArg).toHaveProperty("subject", email)
  })

  it("should NOT recreate existing user", async () => {
    let req = await mockAuthorizationCodeResponseRequest()
    req.queryStringParameters.provider = PROVIDER_NAME

    mockProviderConfigInEnvironment()

    // setup mocks:
    const identityRepo = identityRepositoryFactory()
    const userRepo = userRepositoryFactory()
    const userRepoCreateSpy = sinon.spy(userRepo, "create")

    // setup token response for redirect:
    const email = randomEmail()
    const tokenResponse = mockFetchJsonWithEmail(email)

    // setup the handler:
    const oauthRedirectHandler = oAuthRedirectHandlerFactory(
      tokenResponse,
      userRepo,
      identityRepo
    )
    // FIRST redirect/auth:
    const response = await oauthRedirectHandler(req)
    const foundSession = readSessionID(response)
    expect(userRepoCreateSpy.callCount).toEqual(1)

    // SECOND redirect/auth:
    //   add the session for the last created user and do the auth again:
    req = await mockAuthorizationCodeResponseRequest(foundSession)
    await oauthRedirectHandler(req)
    // here we don't want a second user created for the same authentication info from token response, so make sure it wasn't created:
    expect(userRepoCreateSpy.callCount).toEqual(1)
  })

  it("should allow user to login with multiple providers", async () => {
    let req = await mockAuthorizationCodeResponseRequest()

    mockProviderConfigInEnvironment()

    // setup mocks:
    const identityRepo = identityRepositoryFactory()
    const identityRepoUpsertSpy = sinon.spy(identityRepo, "upsert")
    const userRepo = userRepositoryFactory()
    const userRepoCreateSpy = sinon.spy(userRepo, "create")

    // setup token response for redirect:
    const email = randomEmail()
    const tokenResponse = mockFetchJsonWithEmail(email)

    // setup the handler:
    const oauthRedirectHandler = oAuthRedirectHandlerFactory(
      tokenResponse,
      userRepo,
      identityRepo
    )

    // FIRST redirect/auth:
    let response = await oauthRedirectHandler(req)
    expect(response).toHaveProperty("statusCode", 302)
    const foundSession = readSessionID(response)
    // should have created 1 user with 1 identity
    expect(userRepoCreateSpy.callCount).toEqual(1)
    expect(identityRepoUpsertSpy.callCount).toEqual(1)
    // get the created user:
    const createdUser: StoredUser = await userRepoCreateSpy.firstCall
      .returnValue

    // SECOND redirect/auth with a different provider:
    req = await mockAuthorizationCodeResponseRequest(foundSession)
    req.pathParameters = {
      provider: PROVIDER_ALTERNATE_NAME,
    }
    mockProviderConfigInEnvironment(PROVIDER_ALTERNATE_NAME)

    response = await oauthRedirectHandler(req)
    expect(response).toHaveProperty("statusCode", 302)
    // expect no new user to be created, so callCount still 1:
    expect(userRepoCreateSpy.callCount).toEqual(1)

    // expect a SECOND identity to have been created:
    expect(identityRepoUpsertSpy.callCount).toEqual(2)

    // expect both identities to be for the same user:
    const upsertCalls = identityRepoUpsertSpy
      .getCalls()
      .map((up) => up.firstArg)
    expect(upsertCalls).toHaveLength(2)
    // first lets make sure that the two identities were created for different providers
    const identityProviders = upsertCalls.map(
      (arg) => (arg as StoredIdentityProposal).provider
    )
    expect(identityProviders[0]).not.toEqual(identityProviders[1])

    const identityUserIDs = upsertCalls.map(
      (arg) => (arg as StoredIdentityProposal).userID
    )
    identityUserIDs.forEach((actualUserID) =>
      expect(actualUserID).toEqual(createdUser.id)
    )
  })

  it("should save access/refresh token into DB", async () => {
    const req = await mockAuthorizationCodeResponseRequest()

    mockProviderConfigInEnvironment()

    // setup mocks:
    const userRepo = userRepositoryFactory()
    const userRepoCreateSpy = sinon.spy(userRepo, "create")
    const identityRepo = identityRepositoryFactory()
    const email = randomEmail()
    const fetchJson = mockFetchJsonWithEmail(email)
    const oauthRedirectHandler = oAuthRedirectHandlerFactory(
      fetchJson,
      userRepo,
      identityRepo
    )

    const identityRepoUpsert = sinon.spy(identityRepo, "upsert")

    // invoke handler
    await oauthRedirectHandler(req)

    const newUser = await userRepoCreateSpy.firstCall.returnValue
    expect(identityRepoUpsert.callCount).toEqual(1)
    const actualToken = identityRepoUpsert.firstCall.args[0]
    expect(actualToken).toHaveProperty("provider", PROVIDER_NAME)
    expect(actualToken).toHaveProperty("userID", newUser.id)
    expect(actualToken).toHaveProperty("expires_at", expect.anything())
    expect(actualToken).toHaveProperty("access_token", expect.anything())
    expect(actualToken).toHaveProperty("refresh_token", expect.anything())
    expect(actualToken.expires_at).toBeGreaterThan(Date.now())
  })

  it("should create a session to indicate the user is indeed logged in", async () => {
    const oauthRedirectHandler = oAuthRedirectHandlerFactory(
      mockFetchJson(),
      userRepositoryFactory(),
      identityRepositoryFactory()
    )
    const req = await mockAuthorizationCodeResponseRequest()

    mockProviderConfigInEnvironment()

    // invoke handler
    const res = await oauthRedirectHandler(req)
    assert(res, "expected response")
    expect(res).toHaveProperty("statusCode", 302)
    // make sure it created a session
    expectSession(res)
  })

  it.todo(
    "should redirect the user to the after-login redirect page in query params"
  )

  it("should redirect the user to the default after-login redirect page", async () => {
    const oauthRedirectHandler = oAuthRedirectHandlerFactory(
      mockFetchJson(),
      userRepositoryFactory(),
      identityRepositoryFactory()
    )
    const req = await mockAuthorizationCodeResponseRequest()

    mockProviderConfigInEnvironment()

    // invoke handler for production (root)
    let res = await oauthRedirectHandler(req)
    expect(res).toHaveProperty("statusCode", 302)
    expect(res).toHaveProperty("headers.location", "/")

    // invoke handler for staging (it used to be deployed to /staging, but we deploy everything to / now. Consider removing this test)
    process.env.NODE_ENV = "staging"
    res = await oauthRedirectHandler(req)
    expect(res).toHaveProperty("statusCode", 302)
    expect(res).toHaveProperty("headers.location", "/")
  })

  // I don't know what it is about this test, but the sandbox DDB returns an UnrecognizedClientException (or is it somehow not sandbox?)
  // TODO: Fix this by mocking out the token/user repositories
  it.skip("should handle form_post response_method", async () => {
    const oauthRedirectHandler = oAuthRedirectHandlerFactory(
      mockFetchJson(),
      userRepositoryFactory(),
      identityRepositoryFactory()
    )
    const req = await mockAuthorizationCodeResponseRequest()

    mockProviderConfigInEnvironment()

    req.requestContext.http.method = "POST"
    // now switch this one from query to form_post:
    const params = new URLSearchParams()
    params.append("code", req.queryStringParameters.code as string)
    delete req.queryStringParameters.code
    params.append("state", req.queryStringParameters.state as string)
    delete req.queryStringParameters.state
    req.headers.contentType = "application/x-www-form-urlencoded"
    req.body = params.toString()

    // invoke handler
    const res = await oauthRedirectHandler(req)
    expect(res).toHaveProperty("statusCode", 302)
  })

  it.todo("should detect and create apple-specific client secret")
})

type LambdaHttpRequestMock = LambdaHttpRequest &
  Omit<LambdaHttpRequest, "queryStringParameters"> & {
    queryStringParameters: APIGatewayProxyEventQueryStringParameters
  }
/**
 * Mocks out a request to the app from the authorization server
 */
async function mockAuthorizationCodeResponseRequest(
  userID: string = createAnonymousSessionID()
): Promise<LambdaHttpRequestMock> {
  const req = createMockRequest()
  // we expect a path param that specifies the provider name:
  req.pathParameters = {
    provider: PROVIDER_NAME,
  }

  // because for state validation we need a session ID. Since no user is logged in we can kinda create anything, but we'll create an anonymous one:
  injectSessionToRequest(req, userID)
  const sessionID = readSessionID(req)
  const csrfToken = await createCSRFToken(sessionID)

  // add success required query params
  req.queryStringParameters = req.queryStringParameters || {}
  req.queryStringParameters.code = randomInt().toString()
  req.queryStringParameters.state = csrfToken
  return req as LambdaHttpRequestMock
}

function createIDToken(email: string = `foo-${randomInt()}@bar.com`): string {
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
  process.env[`OAUTH_${providerName}_ENDPOINT_REDIRECT`] =
    "https://mysite/auth/redir/goo"
}
