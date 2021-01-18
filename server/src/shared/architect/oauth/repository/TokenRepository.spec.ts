import { first } from "irritable-iterable"
import { randomInt } from "../../../../../test/support"
import tokenRepositoryFactory, {
  StoredToken,
  StoredTokenProposal,
  TokenRepository,
} from "./TokenRepository"

let repo: TokenRepository

beforeEach(() => {
  repo = tokenRepositoryFactory()
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
    await expect(
      repo.get((null as any) as string, "something")
    ).rejects.toThrowError(/userID must be provided/)
    await expect(
      repo.get("something", (null as any) as string)
    ).rejects.toThrowError(/provider must be provided/)
  })
})

describe("listForUser", () => {
  it("should return providers", async () => {
    const proposed = randomToken()
    await repo.upsert(proposed)
    const tokens = await repo.listForUser(proposed.userID)
    expect(tokens).toHaveLength(1)
    expect(first(tokens)).toHaveProperty("provider", proposed.provider)
  })

  it("should be empty with no tokens", async () => {
    const proposed = randomToken()
    // don't add user:
    const tokens = await repo.listForUser(proposed.userID)
    expect(tokens).toHaveLength(0)
  })
})

function expectStrictTokenProps(actual: StoredToken): void {
  const expectedProps: Record<string, string> = {
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
  expect(new Set(Reflect.ownKeys(expectedProps))).toEqual(
    new Set(Reflect.ownKeys(actual))
  )

  for (const propName in expectedProps) {
    const rec: Record<string, string> = (actual as any) as Record<
      string,
      string
    >
    expect(typeof rec[propName]).toEqual(expectedProps[propName])
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
