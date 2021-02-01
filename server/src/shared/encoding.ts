type BufferEncoding =
  | "ascii"
  | "utf8"
  | "utf-8"
  | "utf16le"
  | "ucs2"
  | "ucs-2"
  | "base64"
  | "latin1"
  | "binary"
  | "hex"

/**
 * From base64 to the specified target encoding.
 */
export function fromBase64(
  base64Encoded: string,
  targetEncoding: BufferEncoding = "utf-8"
): string {
  return Buffer.from(base64Encoded, "base64").toString(targetEncoding)
}
