import sinon from "sinon"
import { randomInt } from "../../../../../test/support"
import { createMockRequest } from "../../../../../test/support/lambda"
import { createCSRFToken, CSRF_HEADER_NAME } from "../../csrf"
import { LambdaHttpHandler, LambdaHttpRequest } from "../../lambda"
import { injectSessionToRequest } from "../../session"
import identityRepositoryFactory, {
  IdentityRepository,
  StoredIdentity,
} from "../repository/IdentityRepository"
import userRepositoryFactory, {
  UserRepository,
} from "../repository/UserRepository"
import meHandlerFactory from "./me"

async function initializeHandlerAndMocks(
  httpMethod: string = "GET"
): Promise<{
  request: LambdaHttpRequest
  handler: LambdaHttpHandler
  testUserID: string
  identityID: string
  identityID2: string
  identityRepoStub: sinon.SinonStubbedInstance<IdentityRepository>
  userRepoStub: sinon.SinonStubbedInstance<UserRepository>
}> {
  const testUserID = `user:foo-${randomInt()}`
  const identityID = `identity:${testUserID}#$foo`
  const identityID2 = `identity:${testUserID}#$foo2`
  const request = createMockRequest()
  request.requestContext.http.method = httpMethod

  injectSessionToRequest(request, { userID: testUserID })
  // setup CSRF
  const token = await createCSRFToken(testUserID)
  request.headers[CSRF_HEADER_NAME] = token

  // mock repositories:
  const userRepo = userRepositoryFactory()
  const userRepoStub = sinon.stub(userRepo)
  userRepoStub.get.withArgs(testUserID).resolves({
    id: testUserID,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  })

  const identityRepo = identityRepositoryFactory()
  const identityRepoStub = sinon.stub(identityRepo)
  identityRepoStub.listForUser.returns(
    Promise.resolve([
      {
        provider: "test-provider-one",
        userID: testUserID,
        id: identityID,
      } as StoredIdentity,
      {
        provider: "test-provider-two",
        userID: testUserID,
        id: identityID2,
      } as StoredIdentity,
    ])
  )

  const handler = meHandlerFactory(userRepo, identityRepo)

  return {
    request,
    handler,
    testUserID,
    identityID,
    identityRepoStub,
    userRepoStub,
    identityID2,
  }
}

describe("me handler GET", () => {
  it("should return a valid user", async () => {
    const { request, handler } = await initializeHandlerAndMocks()
    const response = await handler(request)

    expect(response.statusCode).toEqual(200)
    expect(response.body).toBeTruthy()
    const bodyJson = JSON.parse(response.body as string)
    const expectedProps = ["sub", "createdAt", "updatedAt", "identities"]
    expectedProps.forEach((prop) => expect(bodyJson).toHaveProperty(prop))
  })

  it("should handle missing user", async () => {
    const req = createMockRequest()
    const testUserID = `user:foo-${randomInt()}`

    injectSessionToRequest(req, { userID: testUserID })

    // mock repositories:
    const userRepo = userRepositoryFactory()
    const userGetStub = sinon.stub(userRepo, "get")
    userGetStub.resolves(null)

    const identityRepo = identityRepositoryFactory()
    sinon.stub(identityRepo)

    const handler = meHandlerFactory(userRepo, identityRepo)
    const response = await handler(req)
    expect(response.statusCode).toEqual(401)

    expect(response.body).toBeTruthy()
    const bodyJson = JSON.parse(response.body as string)
    expect(bodyJson).toHaveProperty("error", expect.stringMatching(/not found/))
  })

  it("should handle unauthenticated session", async () => {
    const { request, handler } = await initializeHandlerAndMocks("DELETE")
    // remove cookies/authn:
    request.cookies = []
    const response = await handler(request)
    expect(response).toHaveProperty("statusCode", 401)
  })
})

describe("me handler DELETE", () => {
  it("should delete a valid user (and related identities)", async () => {
    const {
      request,
      handler,
      userRepoStub,
      identityRepoStub,
      testUserID,
      identityID,
      identityID2,
    } = await initializeHandlerAndMocks("DELETE")
    const response = await handler(request)
    expect(response).toHaveProperty("statusCode", 200)

    expect(userRepoStub.delete.withArgs(testUserID).callCount).toEqual(1)
    expect(identityRepoStub.delete.withArgs(identityID).callCount).toEqual(1)
    expect(identityRepoStub.delete.withArgs(identityID2).callCount).toEqual(1)
  })

  it("should handle missing user", async () => {
    const {
      request,
      handler,
      userRepoStub,
      testUserID,
    } = await initializeHandlerAndMocks("DELETE")
    userRepoStub.get.withArgs(testUserID).resolves(null)

    const response = await handler(request)
    expect(response).toHaveProperty("statusCode", 401)
  })
  it("should require authentication", async () => {
    const { request, handler } = await initializeHandlerAndMocks("DELETE")
    // remove cookies/authn:
    request.cookies = []
    const response = await handler(request)
    expect(response).toHaveProperty("statusCode", 401)
  })
})
