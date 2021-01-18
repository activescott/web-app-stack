import assert from "assert"
import Repository from "./Repository"
import { StoredItem } from "./StoredItem"

export interface TokenRepository {
  upsert(token: StoredTokenProposal): Promise<StoredToken>
  get(userID: string, provider: string): Promise<StoredToken>
  list(): Promise<Iterable<StoredToken>>
  listForUser(userID: string): Promise<Iterable<StoredToken>>
  delete(tokenID: string): Promise<void>
}

export default function tokenRepositoryFactory(): TokenRepository {
  return new TokenRepositoryImpl()
}

class TokenRepositoryImpl
  extends Repository<StoredToken>
  implements TokenRepository {
  public constructor() {
    super("token")
  }

  public async upsert(token: StoredTokenProposal): Promise<StoredToken> {
    const REQUIRED_ADD_PROPS = [
      "userID",
      "provider",
      "access_token",
      "refresh_token",
      "expires_at",
    ]
    this.throwIfRequiredPropertyMissing(token, REQUIRED_ADD_PROPS)

    const readyToken = {
      ...token,
      id: this.idForToken(token.userID, token.provider),
    }
    return await super.addItem(readyToken)
  }

  public async get(userID: string, provider: string): Promise<StoredToken> {
    if (!userID) throw new Error("userID must be provided")
    if (!provider) throw new Error("provider must be provided")
    const id = this.idForToken(userID, provider)
    const result = await (await this.getDDB())
      .get({
        TableName: await this.getTableName(),
        Key: { id: id },
      })
      .promise()
    return result.Item as StoredToken
  }

  /**
   * Lists all the tokens for the specified userID.
   * @param userID
   */
  public async listForUser(userID: string): Promise<Iterable<StoredToken>> {
    if (!userID || typeof userID !== "string") {
      throw new Error("userID argument must be provided and must be a string")
    }
    const result = await (await this.getDDB())
      .scan({
        TableName: await this.getTableName(),
        FilterExpression: "begins_with(id, :id_prefix)",
        ExpressionAttributeValues: {
          ":id_prefix": this.idPrefix(userID),
        },
      })
      .promise()

    if (!result.Items || result.Items.length === 0) {
      return []
    }
    // TODO: need to fix this. See Alert Genie for some examples of doing this more cleanly with an Iterable.
    assert(
      !result.LastEvaluatedKey,
      "LastEvaluatedKey not empty. More items must exist and paging isn't implemented!"
    )
    return result.Items as StoredToken[]
  }

  public async list(): Promise<Iterable<StoredToken>> {
    return this.listItems()
  }

  public async delete(tokenID: string): Promise<void> {
    return this.deleteItem(tokenID)
  }

  private idForToken(userID: string, provider: string): string {
    return `${this.tableNickname}:${userID}#${provider}`
  }

  private idPrefix(userID: string): string {
    return `${this.tableNickname}:${userID}#`
  }
}

/**
 * Represents an OAuth tokens for the combination of a user and a particular OAuth authorization server (provider).
 */
export interface StoredToken extends StoredItem {
  /**
   * This is the internal unique id for these credentials.
   */
  id: string
  /**
   * The userID as provided by @see StoredUser.userID.
   */
  userID: string
  /**
   * The name of the provider. This is the prefix/name of the provider used in configuration. It MUST NOT be changed once a credential for the provider is stored.
   */
  provider: string
  /**
   * The OAuth access token
   */
  access_token: string
  /**
   * The OAuth refresh token.
   * Refresh tokens are optional.
   */
  refresh_token?: string
  /**
   * The time the access_token expires (milliseconds since epoch).
   */
  expires_at: number
}

export type StoredTokenProposal = Omit<
  StoredToken,
  "id" | "createdAt" | "updatedAt"
>
