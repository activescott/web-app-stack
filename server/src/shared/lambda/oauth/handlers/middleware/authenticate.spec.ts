import sinon from "sinon"
import { randomInt } from "../../../../../../test/support"
import { createMockRequest } from "../../../../../../test/support/lambda"
import { UNAUTHENTICATED } from "../../../httpStatus"
import {
  LambdaHttpHandler,
  LambdaHttpRequest,
  LambdaHttpResponse,
} from "../../../lambda"
import { injectSessionToRequest } from "../../../session"
import userRepositoryFactory, {
  UserRepository,
} from "../../repository/UserRepository"
import { authenticateHandlerFactory } from "./authenticate"

async function mockHandlerImp(): Promise<LambdaHttpResponse> {
  return {
    statusCode: 200,
  }
}

afterEach(() => {
  sinon.restore()
})

function initializeHandlerAndMocks(): {
  request: LambdaHttpRequest
  handler: LambdaHttpHandler
  mockHandler: sinon.SinonSpy
  userRepoStub: sinon.SinonStubbedInstance<UserRepository>
  testUserID: string
} {
  const request = createMockRequest()
  const testUserID = `user:foo-${randomInt()}`

  injectSessionToRequest(request, { userID: testUserID })

  // mock handler:
  const mockHandler = sinon.spy(mockHandlerImp)

  // mock repositories:
  const userRepo = userRepositoryFactory()
  const userRepoStub = sinon.stub(userRepo)
  userRepoStub.get.withArgs(testUserID).resolves({
    id: testUserID,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  })

  const handler = authenticateHandlerFactory(mockHandler, userRepo)
  return {
    request,
    handler,
    mockHandler,
    userRepoStub,
    testUserID,
  }
}

it("should invoke handler for authentic session", async () => {
  const { request, handler, mockHandler } = initializeHandlerAndMocks()
  const response = await handler(request)

  expect(response.statusCode).toEqual(200)
  expect(mockHandler.callCount).toEqual(1)
})

it("should handle unauthenticated session", async () => {
  const req = createMockRequest()
  // NOTE: No session created on req

  // mock handler:
  const mockHandler = sinon.spy(mockHandlerImp)

  // mock repositories:
  const userRepo = userRepositoryFactory()
  sinon.stub(userRepo)

  const handler = authenticateHandlerFactory(mockHandler, userRepo)
  const response = await handler(req)
  expect(response.statusCode).toEqual(401)
})

it("should handle missing user", async () => {
  const req = createMockRequest()
  const testUserID = `user:foo-${randomInt()}`

  injectSessionToRequest(req, { userID: testUserID })

  // mock handler:
  const mockHandler = sinon.spy(mockHandlerImp)

  // mock repositories:
  const userRepo = userRepositoryFactory()
  const userGetStub = sinon.stub(userRepo, "get")
  userGetStub.resolves(null)

  const handler = authenticateHandlerFactory(mockHandler, userRepo)
  const response = await handler(req)
  expect(response.statusCode).toEqual(401)
})

it("should handle unexpected user repo error", async () => {
  const {
    request,
    handler,
    userRepoStub,
    testUserID,
  } = initializeHandlerAndMocks()

  userRepoStub.get.withArgs(testUserID).rejects()

  const response = await handler(request)
  expect(response.statusCode).toEqual(UNAUTHENTICATED)
})
