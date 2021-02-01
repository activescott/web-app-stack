import Repository from "./Repository"
import { StoredItem } from "./StoredItem"

/**
 * The storage for users of this application
 */
export interface UserRepository {
  /**
   * Creates a new user
   * @param user The newly created user.
   */
  create(): Promise<StoredUser>
  get(userID: string): Promise<StoredUser | null>
  list(): Promise<Iterable<StoredUser>>
  delete(userID: string): Promise<void>
}

//NOTE: This is async just in case we need some async init later.
export default function userRepositoryFactory(): UserRepository {
  return new UserStoreImpl()
}

class UserStoreImpl extends Repository<StoredUser> implements UserRepository {
  public constructor() {
    super("user")
  }

  public async create(): Promise<StoredUser> {
    return await super.addItem({
      id: this.newID(),
    })
  }

  public async list(): Promise<Iterable<StoredUser>> {
    return this.listItems()
  }

  public async delete(userID: string): Promise<void> {
    return this.deleteItem(userID)
  }

  public async get(userID: string): Promise<StoredUser | null> {
    return super.getItem(userID)
  }
}

/* eslint-disable @typescript-eslint/no-empty-interface */
/**
 * Represents a user in storage.
 */
export interface StoredUser extends StoredItem {}
/* eslint-enable @typescript-eslint/no-empty-interface */

/**
 * Used for adding a new user
 */
export type StoredUserProposal = Omit<
  StoredUser,
  "id" | "createdAt" | "updatedAt"
>
