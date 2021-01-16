import userRepositoryFactory, {
  StoredUser,
  StoredUserProposal,
  UserRepository,
} from "./UserRepository"
import { randomEmail } from "../../../../../test/support"

let users: UserRepository

beforeEach(() => {
  users = userRepositoryFactory()
})

afterEach(async () => {
  for (const user of await users.list()) {
    await users.delete(user.id)
  }
})

describe("addUser", () => {
  it("should return a new user with expected props", async () => {
    const proposed = randomUser()
    const added = await users.add(proposed)
    expectStrictUserProps(added)
  })

  it("should not overwrite/add user if the email already exists", async () => {
    const one = {
      email: "one@foo.bar",
    }
    await users.add(one)
    await expect(users.add(one)).rejects.toThrowError(
      /attempting to add user that already exists/
    )
  })
})

describe("getUserFromEmail", () => {
  it("should find user after adding (and returns specific expected properties)", async () => {
    const user = randomUser()
    await users.add(user)
    const found = await users.getFromEmail(user.email)
    expect(found).toHaveProperty("email", user.email)
    expectStrictUserProps(found as StoredUser)
  })

  it("should return null when user not found", async () => {
    const user = randomUser()
    // DON'T add user
    await expect(users.getFromEmail(user.email)).resolves.toBeNull()
  })
})

describe("listUsers", () => {
  it("should return correct number of users", async () => {
    await users.add(randomUser())
    await users.add(randomUser())
    const list = await users.list()
    expect(list).toHaveLength(2)
  })
})

function expectStrictUserProps(actual: StoredUser): void {
  const expectedProps: Record<string, string> = {
    email: "string",
    id: "string",
    createdAt: "number",
    updatedAt: "number",
  }
  // make sure the returned object has exactly these props:
  expect(Reflect.ownKeys(expectedProps)).toEqual(Reflect.ownKeys(actual))

  for (const propName in expectedProps) {
    const rec: Record<string, string> = (actual as any) as Record<
      string,
      string
    >
    expect(typeof rec[propName]).toEqual(expectedProps[propName])
  }
}

function randomUser(): StoredUserProposal {
  return {
    email: randomEmail(),
  }
}
