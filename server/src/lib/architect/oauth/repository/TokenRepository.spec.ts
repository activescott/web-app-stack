import { randomInt } from "../../../../../test/support"
import {
  StoredToken,
  StoredTokenProposal,
  TokenRepository,
  tokenRepositoryFactory,
} from "./TokenRepository"

let repo: TokenRepository = null

beforeEach(async () => {
  repo = await tokenRepositoryFactory()
})

afterEach(async () => {
  for (const token of await repo.list()) {
    await repo.delete(token.id)
  }
})

describe("upsert", () => {
  it("should add a new token for existing user", async () => {
    const proposed = randomToken()
    const added = await repo.upsert(proposed)
    expectStrictTokenProps(added)
  })

  it("should overwrite an existing token", async () => {
    const proposed = randomToken()

    await Promise.allSettled([repo.upsert(proposed), repo.upsert(proposed)])

    const list = await repo.list()
    expect(list).toHaveLength(1)
  })

  it.todo("should reject if missing args")
})

describe("get", () => {
  it("should return token if exist", async () => {
    const proposed = randomToken()
    const added = await repo.upsert(proposed)
    await expect(repo.get(proposed.userID, proposed.provider)).resolves.toEqual(
      added
    )
  })

  it("should return null if token doesn't exist", async () => {
    const proposed = randomToken()
    //DON'T Add it; const added = await repo.upsert(proposed)
    await expect(
      repo.get(proposed.userID, proposed.provider)
    ).resolves.toBeUndefined()
  })

  it("should reject if missing args", async () => {
    await expect(repo.get(null, "something")).rejects.toThrowError(
      /userID must be provided/
    )
    await expect(repo.get("something", null)).rejects.toThrowError(
      /provider must be provided/
    )
  })
})

function expectStrictTokenProps(user: StoredToken): void {
  const expectedUserProps = {
    id: "string",
    userID: "string",
    provider: "string",
    access_token: "string",
    refresh_token: "string",
    expires_at: "number",
    createdAt: "number",
    updatedAt: "number",
  }
  // make sure the returned object has exactly these props:
  expect(new Set(Reflect.ownKeys(expectedUserProps))).toEqual(
    new Set(Reflect.ownKeys(user))
  )

  for (const propName in expectedUserProps) {
    expect(typeof user[propName]).toEqual(expectedUserProps[propName])
  }
}

function randomToken(): StoredTokenProposal {
  return {
    userID: `uid:${randomInt()}`,
    provider: `provider:${randomInt()}`,
    access_token: `access:${randomInt()}`,
    refresh_token: `refresh:${randomInt()}`,
    expires_at: Date.now() + 10000,
  }
}
