import assert from "assert"
import { chain } from "irritable-iterable"
import sinon from "sinon"
import { randomInt } from "../../../../../test/support"
import { createMockRequest } from "../../../../../test/support/lambda"
import { createCSRFToken, CSRF_HEADER_NAME } from "../../csrf"
import {
  BAD_REQUEST,
  FORBIDDEN,
  NOT_FOUND,
  UNAUTHENTICATED,
} from "../../httpStatus"
import { LambdaHttpHandler, LambdaHttpRequest } from "../../lambda"
import { injectSessionToRequest } from "../../session"
import identityRepositoryFactory, {
  IdentityRepository,
} from "../repository/IdentityRepository"
import userRepositoryFactory, {
  UserRepository,
} from "../repository/UserRepository"
import meDeleteIdentityFactory from "./meDeleteIdentity"

const TEST_PROVIDER = "FOO"

/**
 * Sets initializes the handler for a valid/happy-path request.
 */
async function initializeHandlerAndMocks(
  httpMethod: string = "DELETE"
): Promise<{
  request: LambdaHttpRequest
  handler: LambdaHttpHandler
  testUserID: string
  identityID: string
  identityRepoStub: sinon.SinonStubbedInstance<IdentityRepository>
  userRepoStub: sinon.SinonStubbedInstance<UserRepository>
}> {
  const testUserID = `user:foo-${randomInt()}`
  const identityID = `identity:${testUserID}#${TEST_PROVIDER}`
  const identityIDAlternate = `identity:${testUserID}#ALT_PROVIDER`

  const request = createMockRequest()
  request.requestContext.http.method = httpMethod

  injectSessionToRequest(request, { userID: testUserID })
  // setup CSRF
  const token = await createCSRFToken(testUserID)
  request.headers[CSRF_HEADER_NAME] = token

  // path parameter for this handler
  request.pathParameters = request.pathParameters || {}
  request.pathParameters["identityID"] = identityID

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
  identityRepoStub.delete.resolves()

  // make sure that the identityRepo returns the sought test identity, as well as one other one by default
  identityRepoStub.listForUser.withArgs(testUserID).resolves(
    chain([
      {
        id: identityID,
        userID: testUserID,
        provider: TEST_PROVIDER,
        access_token: "at",
        createdAt: Date.now(),
        expires_at: Date.now(),
        subject: "test",
        updatedAt: Date.now(),
      },
      {
        id: identityIDAlternate,
        userID: testUserID,
        provider: TEST_PROVIDER,
        access_token: "at",
        createdAt: Date.now(),
        expires_at: Date.now(),
        subject: "test",
        updatedAt: Date.now(),
      },
    ])
  )

  const handler = meDeleteIdentityFactory(userRepo, identityRepo)
  return {
    request,
    handler,
    testUserID,
    identityID,
    identityRepoStub,
    userRepoStub,
  }
}

it("should delete a valid identity", async () => {
  const { request, handler } = await initializeHandlerAndMocks()
  const response = await handler(request)
  expect(response.statusCode).toEqual(200)
})

it.each([
  ["GET"],
  ["HEAD"],
  ["POST"],
  ["PUT"],
  ["CONNECT"],
  ["OPTIONS"],
  ["TRACE"],
  ["PATCH"],
])(
  "should fail if request method/verb is not DELETE (%s)",
  async (method: string) => {
    const { request, handler } = await initializeHandlerAndMocks(method)
    const response = await handler(request)
    expect(response.statusCode).toEqual(BAD_REQUEST)
  }
)

it("should only authorize deleting own identities", async () => {
  const { request, handler } = await initializeHandlerAndMocks()

  const otherUserID = `user:foo-${randomInt()}`
  const otherIdentityID = `identity:${otherUserID}#${TEST_PROVIDER}`

  // NOTE: here we specify a different user's identity which the handler should forbid
  assert(request.pathParameters)
  request.pathParameters["identityID"] = otherIdentityID

  // invoke request/handler
  const response = await handler(request)

  // NOTE: FORBIDDEN is more appropriate here, but NOT_FOUND is more convenient for our implementation and as long as it fails, we're good.
  expect(response.statusCode).toEqual(NOT_FOUND)
})

it("should require CSRF token", async () => {
  const { request, handler } = await initializeHandlerAndMocks()
  // for this test delete CSRF token:
  delete request.headers[CSRF_HEADER_NAME]

  const response = await handler(request)
  expect(response.statusCode).toEqual(FORBIDDEN)
})

it("should handle missing identity in request", async () => {
  const { request, handler } = await initializeHandlerAndMocks()
  // remove the parameter from the request for this test:
  assert(request.pathParameters)
  delete request.pathParameters.identityID
  const response = await handler(request)
  expect(response.statusCode).toEqual(BAD_REQUEST)
})

it("should handle missing identity in repository", async () => {
  const {
    request,
    handler,
    identityRepoStub,
    testUserID,
  } = await initializeHandlerAndMocks()
  // remove the identity from the repository for this test:
  identityRepoStub.listForUser.withArgs(testUserID).resolves(
    chain([
      {
        id: "identity:not-the-one-you're-looking-for",
        userID: testUserID,
        provider: TEST_PROVIDER,
        access_token: "at",
        createdAt: Date.now(),
        expires_at: Date.now(),
        subject: "test",
        updatedAt: Date.now(),
      },
      {
        id: "identity:also-not-the-one-you're-looking-for",
        userID: testUserID,
        provider: TEST_PROVIDER,
        access_token: "at",
        createdAt: Date.now(),
        expires_at: Date.now(),
        subject: "test",
        updatedAt: Date.now(),
      },
    ])
  )

  const response = await handler(request)
  expect(response.statusCode).toEqual(NOT_FOUND)
})

it("should handle missing user", async () => {
  const {
    request,
    handler,
    userRepoStub,
    testUserID,
  } = await initializeHandlerAndMocks()
  // remove the user from the repository for this test:
  userRepoStub.get.withArgs(testUserID).resolves(null)

  const response = await handler(request)
  expect(response.statusCode).toEqual(UNAUTHENTICATED)
})

it("should reject unauthenticated session", async () => {
  const { request, handler } = await initializeHandlerAndMocks()
  // for this test remove the session cookie:
  assert(request.cookies)
  for (const key in Object.keys(request.cookies)) {
    delete request.cookies[key]
  }
  const response = await handler(request)
  expect(response.statusCode).toEqual(UNAUTHENTICATED)
})

it("should handle unexpected identity repo error", async () => {
  const {
    request,
    handler,
    identityRepoStub,
    testUserID,
  } = await initializeHandlerAndMocks()

  // cause the identityRep.getByID to reject for this test:
  identityRepoStub.listForUser.withArgs(testUserID).rejects()

  const response = await handler(request)
  // BAD_REQUEST is arguably not correct here, but this is an edge case and any failure seems tolerable
  expect(response.statusCode).toEqual(BAD_REQUEST)
})

it("should not allow deleting last identity (as the user could never login again)", async () => {
  const {
    request,
    handler,
    identityRepoStub,
    identityID,
    testUserID,
  } = await initializeHandlerAndMocks()

  // ensure that the identityRepoStub only returns a single identity
  identityRepoStub.listForUser.withArgs(testUserID).resolves([
    {
      id: testUserID,
      userID: identityID,
      provider: TEST_PROVIDER,
      access_token: "at",
      createdAt: Date.now(),
      expires_at: Date.now(),
      subject: "test",
      updatedAt: Date.now(),
    },
  ])

  const response = await handler(request)
  expect(response.statusCode).toEqual(BAD_REQUEST)
  expect(response.body).toMatch(
    /user must have at least one remaining identity/
  )
})
