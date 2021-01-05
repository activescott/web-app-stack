import { DocumentClient } from "aws-sdk/clients/dynamodb"
import * as arc from "@architect/functions"
import { StoredItem } from "./StoredItem"
import { v4 as uuidv4 } from "uuid"
import assert from "assert"

export default abstract class Repository<T extends StoredItem> {
  private _ddb: DocumentClient
  private _tableName: string
  private _didInit: boolean = false

  protected constructor(protected readonly tableNickname: string) {
    if (!tableNickname) {
      throw new Error("tableNickname must be provided")
    }
  }

  public async init(): Promise<void> {
    const data = await arc.tables()
    this._tableName = data._name(this.tableNickname)
    this._ddb = arc.tables.doc
    this._didInit = true
  }

  protected get tableName(): string {
    this.throwIfUnInitialized()
    return this._tableName
  }

  protected get ddb(): DocumentClient {
    this.throwIfUnInitialized()
    return this._ddb
  }

  /* eslint-disable @typescript-eslint/no-explicit-any */
  protected throwIfRequiredPropertyMissing(
    obj: any,
    requiredProperties: string[]
  ): void {
    /* eslint-enable @typescript-eslint/no-explicit-any */
    for (const attr of requiredProperties) {
      assert(attr in obj && obj[attr], `missing required property ${attr}`)
    }
  }

  protected async addItem(
    proposedItem: Omit<T, "createdAt" | "updatedAt">
  ): Promise<T> {
    try {
      const now = Date.now()
      // NOTE: explicitly NOT modifying the passed-in user obj
      const storedItem: T = {
        ...proposedItem,
        createdAt: now,
        updatedAt: now,
      } as T
      // NOTE: We're trusting the caller to make sure that the proposedItem has every item of T except the ones omitted in the type definition
      const putParams = {
        TableName: this.tableName,
        Item: storedItem,
      }
      await this.ddb.put(putParams).promise()
      return storedItem
    } catch (err) {
      throw new Error("Repository.addItem error: " + err)
    }
  }

  /** Creates a random primary key/hash for the item. */
  protected newID(): string {
    return `${this.tableNickname}:${uuidv4()}`
  }

  protected async listItems(): Promise<Iterable<T>> {
    try {
      const scanned = await this.ddb
        .scan({
          TableName: this.tableName,
        })
        .promise()
      // TODO: need to fix this. See Alert Genie for some examples of doing this more cleanly with an Iterable.
      assert(
        !scanned.LastEvaluatedKey,
        "LastEvaluatedKey not empty. More users must exist and paging isn't implemented!"
      )
      //console.log("scanned.Items:", scanned.Items)
      return scanned.Items as T[]
    } catch (err) {
      throw new Error("Repository.list error: " + err)
    }
  }

  protected async deleteItem(id: string): Promise<void> {
    try {
      const params = {
        TableName: this.tableName,
        Key: { id: id },
      }
      await this.ddb.delete(params).promise()
    } catch (err) {
      throw new Error("Repository.delete error: " + err)
    }
  }

  protected async scan(): Promise<T[]> {
    const scanned = await this.ddb.scan({ TableName: this.tableName }).promise()
    return scanned.Items as T[]
  }

  private throwIfUnInitialized(): void {
    if (!this._didInit) {
      throw new Error(
        "Repository must be initialized with an awaited call to init()"
      )
    }
  }
}
