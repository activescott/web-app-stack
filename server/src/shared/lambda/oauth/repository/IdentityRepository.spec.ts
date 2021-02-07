import { first } from "irritable-iterable"
import { randomInt } from "../../../../../test/support"
import identityRepositoryFactory, {
  StoredIdentity,
  StoredIdentityProposal,
  IdentityRepository,
} from "./IdentityRepository"

let repo: IdentityRepository

beforeEach(() => {
  repo = identityRepositoryFactory()
})

afterEach(async () => {
  for (const identity of await repo.list()) {
    await repo.delete(identity.id)
  }
})

describe("upsert", () => {
  it("should add a new identity for existing user", async () => {
    const proposed = randomIdentity()
    const added = await repo.upsert(proposed)
    expectStrictIdentityProps(added)
  })

  it("should overwrite an existing identity", async () => {
    const proposed = randomIdentity()

    await Promise.all([repo.upsert(proposed), repo.upsert(proposed)])

    const list = await repo.list()
    expect(list).toHaveLength(1)
  })

  it.todo("should reject if missing args")
})

describe("get", () => {
  it("should return identity if exists", async () => {
    const proposed = randomIdentity()
    const added = await repo.upsert(proposed)
    await expect(repo.get(proposed.userID, proposed.provider)).resolves.toEqual(
      added
    )
  })

  it("should return null if doesn't exist", async () => {
    const proposed = randomIdentity()
    //DON'T Add it; const added = await repo.upsert(proposed)
    await expect(
      repo.get(proposed.userID, proposed.provider)
    ).resolves.toBeUndefined()
  })

  it("should reject if missing args", async () => {
    /* eslint-disable @typescript-eslint/no-explicit-any */
    await expect(
      repo.get((null as any) as string, "something")
    ).rejects.toThrowError(/userID must be provided/)
    await expect(
      repo.get("something", (null as any) as string)
    ).rejects.toThrowError(/provider must be provided/)
    /* eslint-enable @typescript-eslint/no-explicit-any */
  })
})

describe("getByProviderSubject", () => {
  it("should return identity if exists", async () => {
    const proposed = randomIdentity()
    const added = await repo.upsert(proposed)
    await expect(
      repo.getByProviderSubject(proposed.provider, proposed.subject)
    ).resolves.toEqual(added)
  })
  it("should return null if doesn't exist", async () => {
    const proposed = randomIdentity()
    // don't added it..
    await expect(
      repo.getByProviderSubject(proposed.provider, proposed.subject)
    ).resolves.toBeFalsy()
  })
  it("should reject if missing args", async () => {
    /* eslint-disable @typescript-eslint/no-explicit-any */
    await expect(
      repo.getByProviderSubject((null as any) as string, "something")
    ).rejects.toThrowError(/provider/)
    await expect(
      repo.getByProviderSubject("something", (null as any) as string)
    ).rejects.toThrowError(/subject/)
    /* eslint-enable @typescript-eslint/no-explicit-any */
  })
})

describe("listForUser", () => {
  it("should return providers", async () => {
    const proposed = randomIdentity()
    await repo.upsert(proposed)
    const identities = await repo.listForUser(proposed.userID)
    expect(identities).toHaveLength(1)
    expect(first(identities)).toHaveProperty("provider", proposed.provider)
  })

  it("should be empty with no identities", async () => {
    const proposed = randomIdentity()
    // don't add user:
    const identities = await repo.listForUser(proposed.userID)
    expect(identities).toHaveLength(0)
  })

  it("should reject if missing args", async () => {
    /* eslint-disable @typescript-eslint/no-explicit-any */
    await expect(
      repo.listForUser((null as any) as string)
    ).rejects.toThrowError(/userID/)
    await expect(
      repo.listForUser((1000 as any) as string)
    ).rejects.toThrowError(/userID/)
    /* eslint-enable @typescript-eslint/no-explicit-any */
  })
})

function expectStrictIdentityProps(actual: StoredIdentity): void {
  const expectedProps: Record<string, string> = {
    id: "string",
    userID: "string",
    provider: "string",
    subject: "string",
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
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const rec: Record<string, string> = (actual as any) as Record<
      string,
      string
    >
    expect(typeof rec[propName]).toEqual(expectedProps[propName])
  }
}

function randomIdentity(): StoredIdentityProposal {
  return {
    userID: `uid:${randomInt()}`,
    provider: `provider:${randomInt()}`,
    subject: `subject:${randomInt()}`,
    access_token: `access:${randomInt()}`,
    refresh_token: `refresh:${randomInt()}`,
    expires_at: Date.now() + 10000,
  }
}
