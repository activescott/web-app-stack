import Tokenater, { SignedToken } from "./Tokenater"

const SECONDS = 1000

describe("Tokenater", () => {
  let ater: Tokenater

  beforeEach(() => {
    ater = new Tokenater("secretish", SECONDS * 10)
  })

  describe("ctor", () => {
    it("should require secret", async () => {
      expect(() => new Tokenater("", SECONDS * 10)).toThrowError(
        /secret must be provided/
      )
    })

    it("should require expiration", async () => {
      expect(() => new Tokenater("super secret", 0)).toThrowError(
        /expiresInMilliseconds must be provided/
      )
    })
  })

  describe("createToken", () => {
    it("should return string", async () => {
      const tok = await ater.createToken()
      expect(tok).not.toBeNull()
      expect(typeof tok).toStrictEqual("string")
      expect(tok.length).toBeGreaterThanOrEqual(68)
      expect(tok.length).toBeLessThanOrEqual(70)
    })

    it("should be valid", async () => {
      const tok = await ater.createToken()
      expect(ater.isValid(tok)).toBeTruthy()
    })

    it("should be valid with specified value", async () => {
      const value = "11111"
      const tok = await ater.createToken(value)
      expect(ater.isValid(tok)).toBeTruthy()
    })

    it("should not permit periods in value", async () => {
      await expect(ater.createToken("has.period")).rejects.toThrowError(
        /must not contain a period/
      )
      await expect(ater.createToken(".")).rejects.toThrowError(
        /must not contain a period/
      )
      await expect(ater.createToken(".begin")).rejects.toThrowError(
        /must not contain a period/
      )
      await expect(ater.createToken("end.")).rejects.toThrowError(
        /must not contain a period/
      )
    })
  })

  describe("isValid", () => {
    it("should reject null/undefined tokens", async () => {
      /* eslint-disable @typescript-eslint/no-explicit-any */
      expect(ater.isValid((undefined as any) as string)).toBeFalsy()
      expect(ater.isValid((null as any) as string)).toBeFalsy()
      /* eslint-enable @typescript-eslint/no-explicit-any */
    })

    it("should accept valid signature + unexpired", async () => {
      const tok = await ater.createToken()
      expect(ater.isValid(tok)).toBeTruthy()
    })

    it("should reject valid signature + expired", async () => {
      let tok = await ater.createToken()
      tok = expireToken(tok)
      expect(ater.isValid(tok)).toBeFalsy()
    })

    it("should reject invalid signature + unexpired", async () => {
      // eslint-disable-next-line prefer-const
      let tok = await ater.createToken()
      tok = mangleTokenSignature(tok)
      expect(ater.isValid(tok)).toBeFalsy()
    })
  })

  describe("getTokenValue", () => {
    it("should provide value", async () => {
      const value = "22"
      const tok = await ater.createToken(value)
      expect(ater.getTokenValue(tok)).toStrictEqual(value)
    })

    it("should throw if invalid signature", async () => {
      const value = "333"
      let tok = await ater.createToken(value)
      tok = mangleTokenSignature(tok)
      expect(() => ater.getTokenValue(tok)).toThrowError()
    })

    it("should throw if expired", async () => {
      const value = "4444"
      let tok = await ater.createToken(value)
      tok = expireToken(tok)
      expect(() => ater.getTokenValue(tok)).toThrowError()
    })
  })
})

function mangleTokenSignature(token: SignedToken): SignedToken {
  // eslint-disable-next-line prefer-const
  let [value, encodedExpiresAtMillis, signature] = token.split(".")
  // mangle the signature
  signature = signature.substring(0, signature.length - 1)
  return `${value}.${encodedExpiresAtMillis}.${signature}`
}

function expireToken(token: SignedToken): SignedToken {
  // eslint-disable-next-line prefer-const
  let [data, encodedExpiresAtMillis, signature] = token.split(".")
  // expire the time and send it back
  encodedExpiresAtMillis = (Date.now() - SECONDS * 60).toString()
  return `${data}.${encodedExpiresAtMillis}.${signature}`
}
