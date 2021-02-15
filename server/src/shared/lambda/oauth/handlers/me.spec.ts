import sinon from "sinon"
import { randomInt } from "../../../../../test/support"
import { createMockRequest } from "../../../../../test/support/lambda"
import { injectSessionToRequest } from "../../session"
import identityRepositoryFactory, {
  StoredIdentity,
} from "../repository/IdentityRepository"
import userRepositoryFactory from "../repository/UserRepository"
import meHandlerFactory from "./me"

describe("me handler", () => {
  it("should return a valid user", async () => {
    const req = createMockRequest()
    const testUserID = `user:foo-${randomInt()}`

    injectSessionToRequest(req, { userID: testUserID })

    // mock repositories:
    const userRepo = userRepositoryFactory()
    const userGetStub = sinon.stub(userRepo, "get")
    userGetStub.returns(
      Promise.resolve({
        id: testUserID,
        email: "foo",
        createdAt: Date.now(),
        updatedAt: Date.now(),
      })
    )

    const identityRepo = identityRepositoryFactory()
    const identityRepoStub = sinon.stub(identityRepo)
    identityRepoStub.listForUser.returns(
      Promise.resolve([{ provider: "my-provider" } as StoredIdentity])
    )

    const handler = meHandlerFactory(userRepo, identityRepo)
    const response = await handler(req)
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
    userGetStub.returns(Promise.resolve(null))

    const identityRepo = identityRepositoryFactory()
    sinon.stub(identityRepo)

    const handler = meHandlerFactory(userRepo, identityRepo)
    const response = await handler(req)
    expect(response.statusCode).toEqual(404)

    expect(response.body).toBeTruthy()
    const bodyJson = JSON.parse(response.body as string)
    expect(bodyJson).toHaveProperty("error", expect.stringMatching(/not found/))
  })

  it("should handle unauthenticated session", async () => {
    const req = createMockRequest()
    // NOTE: No session created on req

    // mock repositories:
    const userRepo = userRepositoryFactory()
    sinon.stub(userRepo)

    const identityRepo = identityRepositoryFactory()
    sinon.stub(identityRepo)

    const handler = meHandlerFactory(userRepo, identityRepo)
    const response = await handler(req)
    expect(response.statusCode).toEqual(401)

    expect(response.body).toBeTruthy()
    const bodyJson = JSON.parse(response.body as string)
    expect(bodyJson).toHaveProperty(
      "error",
      expect.stringMatching(/not authenticated/)
    )
  })
})
