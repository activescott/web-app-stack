import userRepositoryFactory, {
  StoredUser,
  UserRepository,
} from "./UserRepository"

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
    const added = await users.create()
    expectStrictUserProps(added)
  })
})

describe("listUsers", () => {
  it("should return correct number of users", async () => {
    await users.create()
    await users.create()
    const list = await users.list()
    expect(list).toHaveLength(2)
  })
})

describe("get", () => {
  it("should return correct number of users", async () => {
    const added = await users.create()
    expect(users.get(added.id)).toBeTruthy()
  })
})

function expectStrictUserProps(actual: StoredUser): void {
  const expectedProps: Record<string, string> = {
    id: "string",
    createdAt: "number",
    updatedAt: "number",
  }
  // make sure the returned object has exactly these props:
  expect(Reflect.ownKeys(expectedProps)).toEqual(Reflect.ownKeys(actual))

  for (const propName in expectedProps) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const rec: Record<string, string> = (actual as any) as Record<
      string,
      string
    >
    expect(typeof rec[propName]).toEqual(expectedProps[propName])
  }
}
