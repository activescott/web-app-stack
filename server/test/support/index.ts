import { SESSION_COOKIE_NAME } from "../../src/shared/lambda/middleware/session"
import { LambdaHttpResponse } from "../../src/shared/lambda"

export function randomEmail(): string {
  return `${randomInt()}@foo.bar`
}

export function randomInt(max = Number.MAX_SAFE_INTEGER): number {
  return Math.floor(Math.random() * Math.floor(max))
}

function readSessionCookie(res: LambdaHttpResponse): string {
  expect(res).toHaveProperty("cookies")
  const cookieList = res.cookies || []
  return cookieList.find((v) =>
    (v as string).startsWith(SESSION_COOKIE_NAME + "=")
  ) as string
}

export function expectSession(res: LambdaHttpResponse): void {
  const foundSession = readSessionCookie(res)
  expect(typeof foundSession).toStrictEqual("string")
  expect((foundSession as string).length).toBeGreaterThan(0)
}
