import { randomBytes as randomBytesSync, createHash } from "crypto"
import { promisify } from "util"

const randomBytes = promisify(randomBytesSync)

type CSRFToken = string

/**
 * Returns an opaque random token for use as a CSRF token.
 */
export async function createToken(): Promise<CSRFToken> {
  const buf = await randomBytes(1024)
  const hash = createHash("sha256").update(buf)
  return hash.digest("base64")
}
