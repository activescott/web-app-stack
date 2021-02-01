import { createHmac, randomBytes } from "crypto"
import { promisify } from "util"
const randomBytesAsync = promisify(randomBytes)

export type SignedToken = string
export type TokenSecret = string

/** The number of milliseconds between 1 January 1970 00:00:00 UTC */
type ExpiresAtInMilliseconds = number
/** ExpiresAtMilliseconds encoded as a string */
type ExpiresAtEncoded = string

/**
 * Creates signed tokens. Suitable for use cases like CSRF tokens or session IDs that can be validated as created by this module and not tampered with.
 * Based on the stateless HMAC Based Token Pattern described at https://cheatsheetseries.owasp.org/cheatsheets/Cross-Site_Request_Forgery_Prevention_Cheat_Sheet.html#hmac-based-token-pattern
 *
 * Why not use JWT? because these are smaller. A JWT with a similar 8-byte number is >110 bytes due to use of json and base64 encoding all three parts.
 *
 * Tokens are a string with length in the range of 69-71 characters. Details on length are below:
 * - Base64 is Base64 character represents 6 bits of data + 0-2 padding characters
 * - Signature is sha256 so 256 bits / 6 bits per char = 42.6666
 * - Value 64 bits (8 bytes) so 128/6=10.6 chars
 * - Timestamp is simple integer characters and will be 10 digits for at least the next century (NOT base64 encoded!)
 * - Two periods as delimiters:
 * so max length:
 * max = periods + timestamp + value + Signature + base64 padding
 * 70  = 2       + 13        + 10    + 43        + 2
 * so min length:
 * min = periods + timestamp + value + Signature + (no base64 padding)
 * 68  = 2       + 13        + 10    + 43
 */
export default class Tokenater {
  /* eslint-disable no-magic-numbers */
  /**
   * The number of milliseconds in an hour.
   */
  public static HOURS_IN_MS = 1000 * 60 ** 2
  /**
   * The number of milliseconds in a day.
   */
  public static DAYS_IN_MS = 1000 * 60 ** 2 * 24
  /* eslint-enable no-magic-numbers */

  public constructor(
    private readonly secret: TokenSecret,
    private readonly expiresInMilliseconds: number
  ) {
    if (!secret) throw new Error("secret must be provided")
    const MIN_EXPIRES_TIME = 100
    if (!expiresInMilliseconds || expiresInMilliseconds < MIN_EXPIRES_TIME) {
      throw new Error("expiresInMilliseconds must be provided")
    }
  }

  /**
   * Creates and returns a new signed token.
   */
  public async createToken(value?: string): Promise<SignedToken> {
    if (value) {
      if (value.includes("."))
        throw new Error("value must not contain a period")
    } else {
      value = await this.createRandomValue()
    }
    const expiresAtMillis = Date.now() + this.expiresInMilliseconds
    const signature = this.sign(value, expiresAtMillis)
    return `${value}.${this.encodeExpiresAt(expiresAtMillis)}.${signature}`
  }

  /**
   * Returns the value of the token. This is useful if a value was provided when creating the token with @see createToken.
   * NOTE: If the token's signature isn't valid or the token is expired (according to @see isValid ), an exception will be thrown.
   * @param token The token created via @see createToken
   */
  public getTokenValue(token: SignedToken): string {
    if (!this.isValid(token)) {
      throw new Error("Token is not valid")
    }
    const value = token.split(".")[0]
    return value
  }

  /**
   * Returns true if the provided token has a valid signature and is unexpired.
   * @param token The token to validate.
   */
  public isValid(token: SignedToken): boolean {
    if (!token) {
      return false
    }
    const [value, encodedExpiresAt, signature] = token.split(".")
    // check signature
    const expiresAtMillis = this.decodeExpiresAt(encodedExpiresAt)
    const expectedSignature = this.sign(value, expiresAtMillis)
    if (expectedSignature != signature) {
      if (!("TOKENATER_WARNING_DISABLE" in process.env)) {
        // eslint-disable-next-line no-console
        console.warn("token has invalid signature")
      }
      return false
    }
    // check expiration
    if (expiresAtMillis < Date.now()) {
      if (!("TOKENATER_WARNING_DISABLE" in process.env)) {
        // eslint-disable-next-line no-console
        console.warn("token has expired")
      }
      return false
    }
    return true
  }

  private async createRandomValue(): Promise<string> {
    const TOKEN_DATA_LENGTH_BYTES = 8
    // NOTE: This string when encoded w/ base64 is going to be 8 bytes * 8 bits / ~6 = ~11 characters (each base64 character represents ~6 bits)
    return (await randomBytesAsync(TOKEN_DATA_LENGTH_BYTES)).toString("base64")
  }

  private sign(
    value: string,
    expiresAtMillis: ExpiresAtInMilliseconds
  ): string {
    const hmac = createHmac("sha256", this.secret)
    return hmac
      .update(`${value}${this.encodeExpiresAt(expiresAtMillis)}`)
      .digest("base64")
  }

  private encodeExpiresAt(
    expiresAt: ExpiresAtInMilliseconds
  ): ExpiresAtEncoded {
    return Math.floor(expiresAt / SECONDS_PER_MS).toString()
  }

  private decodeExpiresAt(
    expiresAt: ExpiresAtEncoded
  ): ExpiresAtInMilliseconds {
    return Number.parseInt(expiresAt) * SECONDS_PER_MS
  }
}

const SECONDS_PER_MS = 1000
