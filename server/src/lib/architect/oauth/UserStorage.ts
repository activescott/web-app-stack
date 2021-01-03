import * as arc from "@architect/functions"
import { DocumentClient } from "aws-sdk/clients/dynamodb"
/**
 * The storage for users & tokens
 */
export interface UserStorage {
  /**
   * Inserts or updates the specified user.
   * @param user The user to store or update.
   */
  upsertUser(user: StoredUserProposal): boolean
}

export default function userStorageFactory() {}

class UserStorageImpl implements UserStorage {
  private readonly ddb: DocumentClient
  private readonly tableName: string

  public constructor() {
    // see https://arc.codes/docs/en/reference/runtime/node#arc.tables (and source at https://github.com/architect/functions/blob/v3.12.1/src/tables/factory.js)
    this.ddb = arc.tables._doc
    this.tableName = arc.tables.users._name
  }

  upsertUser(user: StoredUserProposal): boolean {
    throw new Error("Method not implemented.")
  }
}

export interface StoredUser {
  id: string
  email: string
  access_token: string
  refresh_token: string
  expires_at: string
}

export interface StoredUserProposal extends Omit<StoredUser, "id"> {}

/**
 * Represents an arc.tables table client.
 * It is a facade around AWS.DynamoDB.DocumentClient
 * More at https://arc.codes/docs/en/reference/runtime/node#arc.tables
 */
interface ArcTableClient {
  /**
   * The raw table name that can be used with an the DDB DocumentClient at
   */
  _name: string
}
