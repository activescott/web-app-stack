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

const ALL_IDENTITY_PROPS = REQUIRED_ADD_PROPS.concat([
  "id",
  "createdAt",
  "updatedAt",
])

/**
 * Represents an OAuth identity for the combination of a user and a particular OAuth authorization server (provider).
 */
export interface StoredIdentity extends StoredItem {
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
  // NOTE: sub is a reserved keyword in DDB so we use "subject" when storing
  /**
   * The unique identifier of the user at this provider.
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

export type StoredIdentityProposal = Omit<
  StoredIdentity,
  "id" | "createdAt" | "updatedAt"
>

export interface IdentityRepository {
  upsert(identity: StoredIdentityProposal): Promise<StoredIdentity>
  /**
   * Returns the identity for the specified user and provider.
   */
  get(userID: string, provider: string): Promise<StoredIdentity>
  /**
   * Returns the identity for the specified provider and subject. Returns undefined if not found.
   * @param provider The name of the provider the identity is for.
   * @param subject The subject/principal id for the provider. For OIDC this would be the `sub` claim.
   */
  getByProviderSubject(
    provider: string,
    subject: string
  ): Promise<StoredIdentity | null>
  /** Returns the identity by it's id */
  getByID(identityID: string): Promise<StoredIdentity | null>
  list(): Promise<Iterable<StoredIdentity>>
  listForUser(userID: string): Promise<Iterable<StoredIdentity>>
  delete(identityID: string): Promise<void>
}

export default function identityRepositoryFactory(): IdentityRepository {
  return new IdentityRepositoryImpl()
}

class IdentityRepositoryImpl
  extends Repository<StoredIdentity>
  implements IdentityRepository {
  public constructor() {
    super("identity")
  }

  public async upsert(
    identity: StoredIdentityProposal
  ): Promise<StoredIdentity> {
    this.throwIfRequiredPropertyMissing(identity, REQUIRED_ADD_PROPS)

    // ensure nobody else is linked to this subject@provider:
    const exists = await this.getByProviderSubject(
      identity.provider,
      identity.subject
    )
    if (exists && exists.userID !== identity.userID) {
      throw new Error(
        `The subject '${identity.subject}' at provider '${identity.provider}' is already linked to another user.`
      )
    }

    const readyIdentity = {
      ...identity,
      id: this.idForIdentity(identity.userID, identity.provider),
      // for our secondary index lookups
      provider_subject: this.providerSubjectHash(
        identity.provider,
        identity.subject
      ),
    }
    const added = await super.addItem(readyIdentity)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    delete (added as any)["provider_subject"]
    return added
  }

  public async get(userID: string, provider: string): Promise<StoredIdentity> {
    if (!userID) throw new Error("userID must be provided")
    if (!provider) throw new Error("provider must be provided")
    const id = this.idForIdentity(userID, provider)
    const result = await (await this.getDDB())
      .get({
        TableName: await this.getTableName(),
        Key: { id: id },
        ProjectionExpression: ALL_IDENTITY_PROPS.join(","),
      })
      .promise()
    return result.Item as StoredIdentity
  }

  public async getByID(identityID: string): Promise<StoredIdentity> {
    if (!identityID) throw new Error("identityID must be provided")
    const result = await (await this.getDDB())
      .get({
        TableName: await this.getTableName(),
        Key: { id: identityID },
        ProjectionExpression: ALL_IDENTITY_PROPS.join(","),
      })
      .promise()
    return result.Item as StoredIdentity
  }

  public async getByProviderSubject(
    provider: string,
    subject: string
  ): Promise<StoredIdentity | null> {
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
        ProjectionExpression: ALL_IDENTITY_PROPS.join(","),
        KeyConditionExpression: "provider_subject = :provider_subject",
        ExpressionAttributeValues: {
          ":provider_subject": this.providerSubjectHash(provider, subject),
        },
      })
      .promise()

    if (!result.Items || result.Items.length === 0) {
      return null
    }
    assert(
      result.Items.length === 0 || result.Items.length === 1,
      `unexpected number of identities returned (${result.Items.length}) for provider ${provider} and subject ${subject}.`
    )
    const item = result.Items[0] as StoredIdentity
    assert(!("provider_subject" in item), "unexpected provider_subject")
    return item
  }

  /**
   * Lists all the identities for the specified userID.
   * @param userID
   */
  public async listForUser(userID: string): Promise<Iterable<StoredIdentity>> {
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
    return result.Items as StoredIdentity[]
  }

  public async list(): Promise<Iterable<StoredIdentity>> {
    return this.listItems()
  }

  public async delete(identityID: string): Promise<void> {
    return this.deleteItem(identityID)
  }

  private idForIdentity(userID: string, provider: string): string {
    return this.idPrefix(userID) + provider
  }

  private idPrefix(userID: string): string {
    return `${this.tableNickname}:${userID}#`
  }

  private providerSubjectHash(provider: string, subject: string): string {
    return `${provider}#${subject}`
  }
}
