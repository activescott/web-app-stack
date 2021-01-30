import assert from "assert"
import Repository from "./Repository"
import { StoredItem } from "./StoredItem"

const REQUIRED_ADD_PROPS = [
  "userID",
  "provider",
  "access_token",
  "refresh_token",
  "expires_at",
  "subject",
]

const ALL_TOKEN_PROPS = REQUIRED_ADD_PROPS.concat([
  "id",
  "createdAt",
  "updatedAt",
])

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
   * The subject identifier of the user at this provider.
   */
  subject: string
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

export interface TokenRepository {
  upsert(token: StoredTokenProposal): Promise<StoredToken>
  get(userID: string, provider: string): Promise<StoredToken>
  /**
   * Returns a token for the specified provider & subject. Returns undefined if not found.
   * @param provider The name of the provider the tokens/identity is for
   * @param subject The subject/principal id for the provider. For OIDC this would be the `sub` claim.
   */
  getByProviderSubject(
    provider: string,
    subject: string
  ): Promise<StoredToken | null>
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
    this.throwIfRequiredPropertyMissing(token, REQUIRED_ADD_PROPS)

    const readyToken = {
      ...token,
      id: this.idForToken(token.userID, token.provider),
      // for our secondary index lookups
      provider_subject: this.providerSubjectHash(token.provider, token.subject),
    }
    const added = await super.addItem(readyToken)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    delete (added as any)["provider_subject"]
    return added
  }

  public async get(userID: string, provider: string): Promise<StoredToken> {
    if (!userID) throw new Error("userID must be provided")
    if (!provider) throw new Error("provider must be provided")
    const id = this.idForToken(userID, provider)
    const result = await (await this.getDDB())
      .get({
        TableName: await this.getTableName(),
        Key: { id: id },
        ProjectionExpression: ALL_TOKEN_PROPS.join(","),
      })
      .promise()
    return result.Item as StoredToken
  }

  public async getByProviderSubject(
    provider: string,
    subject: string
  ): Promise<StoredToken | null> {
    if (!provider || typeof provider !== "string") {
      throw new Error("provider argument must be provided and must be a string")
    }
    if (!subject || typeof subject !== "string") {
      throw new Error("subject argument must be provided and must be a string")
    }
    const result = await (await this.getDDB())
      .query({
        TableName: await this.getTableName(),
        IndexName: "provider_subject-index",
        ProjectionExpression: ALL_TOKEN_PROPS.join(","),
        KeyConditionExpression: "provider_subject = :provider_subject",
        ExpressionAttributeValues: {
          ":provider_subject": this.providerSubjectHash(provider, subject),
        },
      })
      .promise()

    if (!result.Items || result.Items.length === 0) {
      return null
    }
    assert(result.Items.length <= 1)
    const item = result.Items[0] as StoredToken
    assert(!("provider_subject" in item), "unexpected provider_subject")
    return item
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

  private providerSubjectHash(provider: string, subject: string): string {
    return `${provider}#${subject}`
  }
}
