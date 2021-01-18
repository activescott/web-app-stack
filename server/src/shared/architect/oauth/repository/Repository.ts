import { DocumentClient } from "aws-sdk/clients/dynamodb"
import * as arc from "@architect/functions"
import { StoredItem } from "./StoredItem"
import { v4 as uuidv4 } from "uuid"
import assert from "assert"

export default abstract class Repository<T extends StoredItem> {
  private _ddb?: DocumentClient = undefined
  private _tableName?: string = undefined
  private _didInit: boolean = false

  protected constructor(protected readonly tableNickname: string) {
    if (!tableNickname) {
      throw new Error("tableNickname must be provided")
    }
  }

  protected async getTableName(): Promise<string> {
    await this.ensureInitialized()
    assert(this._tableName, "_tableName not initialized")
    return this._tableName
  }

  protected async getDDB(): Promise<DocumentClient> {
    await this.ensureInitialized()
    assert(this._ddb, "_ddb not initialized")
    return this._ddb
  }

  protected throwIfRequiredPropertyMissing(
    obj: Record<string, unknown>,
    requiredProperties: string[]
  ): void {
    for (const attr of requiredProperties) {
      assert(attr in obj, `missing required property ${attr}`)
    }
  }

  protected async addItem(
    proposedItem: Omit<T, "createdAt" | "updatedAt">
  ): Promise<T> {
    await this.ensureInitialized()
    try {
      const now = Date.now()
      // NOTE: explicitly NOT modifying the passed-in obj
      const storedItem: T = {
        ...proposedItem,
        createdAt: now,
        updatedAt: now,
      } as T
      // NOTE: We're trusting the caller to make sure that the proposedItem has every item of T except the ones omitted in the type definition
      const putParams = {
        TableName: await this.getTableName(),
        Item: storedItem,
      }
      await (await this.getDDB()).put(putParams).promise()
      return storedItem
    } catch (err) {
      throw new Error("Repository.addItem error: " + err)
    }
  }

  protected async getItem(id: string): Promise<T> {
    if (!id) throw new Error("id must be provided")
    const result = await (await this.getDDB())
      .get({
        TableName: await this.getTableName(),
        Key: { id: id },
      })
      .promise()
    return result.Item as T
  }

  /** Creates a random primary key/hash for the item. */
  protected newID(): string {
    return `${this.tableNickname}:${uuidv4()}`
  }

  protected async listItems(): Promise<Iterable<T>> {
    await this.ensureInitialized()
    try {
      const scanned = await (await this.getDDB())
        .scan({
          TableName: await this.getTableName(),
        })
        .promise()
      // TODO: need to fix this. See Alert Genie for some examples of doing this more cleanly with an Iterable.
      assert(
        !scanned.LastEvaluatedKey,
        "LastEvaluatedKey not empty. More items must exist and paging isn't implemented!"
      )
      return scanned.Items as T[]
    } catch (err) {
      throw new Error("Repository.list error: " + err)
    }
  }

  protected async deleteItem(id: string): Promise<void> {
    await this.ensureInitialized()
    try {
      const params = {
        TableName: await this.getTableName(),
        Key: { id: id },
      }
      await (await this.getDDB()).delete(params).promise()
    } catch (err) {
      throw new Error("Repository.delete error: " + err)
    }
  }

  protected async scan(): Promise<T[]> {
    await this.ensureInitialized()
    const scanned = await (await this.getDDB())
      .scan({ TableName: await this.getTableName() })
      .promise()
    return scanned.Items as T[]
  }

  private async ensureInitialized(): Promise<void> {
    if (!this._didInit) {
      const data = await arc.tables()
      this._tableName = data._name(this.tableNickname)
      this._ddb = arc.tables.doc
      this._didInit = true
    }
  }
}
