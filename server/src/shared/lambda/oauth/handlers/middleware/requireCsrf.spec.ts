import sinon from "sinon"
import { randomInt } from "../../../../../../test/support"
import { createMockRequest } from "../../../../../../test/support/lambda"
import { createCSRFToken, CSRF_HEADER_NAME } from "../../../csrf"
import { FORBIDDEN } from "../../../httpStatus"
import { LambdaHttpResponse } from "../../../lambda"
import { injectSessionToRequest } from "../../../session"
import {
  AuthenticatedLambdaHttpHandler,
  AuthenticatedLambdaHttpRequest,
} from "./authenticate"
import { requireCsrfHandlerFactory } from "./requireCsrf"

async function mockHandlerImp(): Promise<LambdaHttpResponse> {
  return {
    statusCode: 200,
  }
}

afterEach(() => {
  sinon.restore()
})

async function initializeHandlerAndMocks(): Promise<{
  request: AuthenticatedLambdaHttpRequest
  handler: AuthenticatedLambdaHttpHandler
  mockHandler: sinon.SinonSpy
  testUserID: string
}> {
  const testUserID = `user:foo-${randomInt()}`

  // prepare request
  const request: AuthenticatedLambdaHttpRequest = {
    ...createMockRequest(),
    authenticUser: {
      id: testUserID,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    },
  }
  // Session:
  injectSessionToRequest(request, { userID: testUserID })
  // CSRF
  request.headers[CSRF_HEADER_NAME] = await createCSRFToken(testUserID)

  // mock inner handler:
  const mockHandler = sinon.spy(mockHandlerImp)

  // prepare this handler
  const handler = requireCsrfHandlerFactory(mockHandler)

  return {
    request,
    handler,
    mockHandler,
    testUserID,
  }
}

it("should invoke handler with valid CSRF", async () => {
  const { request, handler, mockHandler } = await initializeHandlerAndMocks()
  const response = await handler(request)
  expect(response.statusCode).toEqual(200)
  expect(mockHandler.callCount).toEqual(1)
})

it("should reject request without CSRF", async () => {
  const { request, handler, mockHandler } = await initializeHandlerAndMocks()
  // for this test remove the CSRF header:
  delete request.headers[CSRF_HEADER_NAME]

  const response = await handler(request)
  expect(response.statusCode).toEqual(FORBIDDEN)
  expect(mockHandler.callCount).toEqual(0)
})

it("should reject request with invalid CSRF", async () => {
  const { request, handler, mockHandler } = await initializeHandlerAndMocks()
  // for this test make CSRF header invalid:
  const wrongUserID = `user:foo-${randomInt()}`
  request.headers[CSRF_HEADER_NAME] = await createCSRFToken(wrongUserID)

  const response = await handler(request)
  expect(response.statusCode).toEqual(FORBIDDEN)
  expect(mockHandler.callCount).toEqual(0)
})
