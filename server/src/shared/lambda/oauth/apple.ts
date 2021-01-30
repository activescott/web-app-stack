import * as jwt from "node-webtokens"

/**
 * Generates a client secret for Sign in with Apple's OIDC Flow as described at https://developer.apple.com/documentation/sign_in_with_apple/generate_and_validate_tokens
 * @param appleTeamID The 10-character Team ID associated with your Apple developer account.
 * @param appleClientID The client ID value associated with your Sign in with Apple service ID.
 * @param appleKeyID They Key ID for the apple private key. Get it from the Apple Developer console at https://developer.apple.com/account/resources/authkeys/list selecting your key and then find the 10-digit identifier under "Key ID".
 * @param applePrivateKey The private key contents you received from Apple (note this is the value of the key, inside of the file you downloaded from Apple).
 */
export function appleSecret(
  appleTeamID: string,
  appleClientID: string,
  appleKeyID: string,
  applePrivateKey: string
): string {
  if (!applePrivateKey) throw new Error("applePrivateKey must be specified")
  if (!appleKeyID) throw new Error("appleKeyID must be specified")

  const kid = appleKeyID
  const keyStore: Record<string, string> = {}
  keyStore[kid] = applePrivateKey

  const EXPIRATION_IN_MINUTES = 2
  const payload = {
    iss: appleTeamID,
    exp: fromMinutes(EXPIRATION_IN_MINUTES),
    aud: "https://appleid.apple.com",
    sub: appleClientID,
  }
  const secret = jwt.generate("ES256", payload, keyStore, kid)
  return secret
}

function fromMinutes(minutes: number): number {
  const MS_PER_SECOND = 1000
  const SECONDS_PER_MIN = 60
  return minutes * SECONDS_PER_MIN + Date.now() / MS_PER_SECOND
}
