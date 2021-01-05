import Repository from "./Repository"
import { StoredItem } from "./StoredItem"

const ALL_USER_PROPS = ["email", "id", "createdAt", "updatedAt"]

/**
 * The storage for users & tokens
 */
export interface UserRepository {
  /**
   * Inserts or updates the specified user.
   * @param user The user to store or update.
   */
  add(user: StoredUserProposal): Promise<StoredUser>
  getFromEmail(email: string): Promise<StoredUser>
  list(): Promise<Iterable<StoredUser>>
  delete(userID: string): Promise<void>
}

//NOTE: This is async just in case we need some async init later.
export default async function userRepositoryFactory(): Promise<UserRepository> {
  const impl = new UserStoreImpl()
  await impl.init()
  return impl
}

class UserStoreImpl extends Repository<StoredUser> implements UserRepository {
  public constructor() {
    super("users")
  }

  public async add(user: StoredUserProposal): Promise<StoredUser> {
    const REQUIRED_ADD_PROPS = ["email"]
    this.throwIfRequiredPropertyMissing(user, REQUIRED_ADD_PROPS)

    const existing = await this.getFromEmail(user.email)
    if (existing) {
      throw new Error("attempting to add user that already exists")
    }
    return await super.addItem({
      ...user,
      id: this.newID(),
    })
  }

  public async list(): Promise<Iterable<StoredUser>> {
    return this.listItems()
  }

  public async delete(userID: string): Promise<void> {
    return this.deleteItem(userID)
  }

  public async getFromEmail(email: string): Promise<StoredUser | null> {
    if (!email || typeof email !== "string") {
      throw new Error("email argument must be provided and must be a string")
    }
    const result = await this.ddb
      .query({
        TableName: this.tableName,
        IndexName: "email-index",
        ProjectionExpression: ALL_USER_PROPS.join(","),
        KeyConditionExpression: "email = :email",
        ExpressionAttributeValues: {
          ":email": email,
        },
      })
      .promise()

    if (!result.Items || result.Items.length === 0) {
      return null
    }
    if (result.Items.length > 1) {
      throw new Error("more than one item returned")
    }

    return result.Items[0] as StoredUser
  }
}

/**
 * Represents a user in storage.
 */
export interface StoredUser extends StoredItem {
  /** User's email address */
  email: string
}

/**
 * Used for adding a new user
 */
export type StoredUserProposal = Omit<
  StoredUser,
  "id" | "createdAt" | "updatedAt"
>
