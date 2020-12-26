import { randomBytes as randomBytesSync, createHash } from "crypto"
import { promisify } from "util"

const randomBytes = promisify(randomBytesSync)

type CSRFToken = string

/**
 * Returns an opaque random token for use as a CSRF token.
 */
export async function createToken(): Promise<CSRFToken> {
  const KEY_LENGTH = 1024
  const buf = await randomBytes(KEY_LENGTH)
  const hash = createHash("sha256").update(buf)
  return hash.digest("base64")
}
