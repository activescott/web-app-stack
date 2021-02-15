import { LambdaHttpHandler, LambdaHttpResponse } from "../../lambda"
import { createAnonymousSession, writeSession } from "../../session"

/** Creates a @see LambdaHttpHandler that handles logout. */
export default function logoutHandlerFactory(): LambdaHttpHandler {
  async function logoutHandler(): Promise<LambdaHttpResponse> {
    const res: LambdaHttpResponse = {
      statusCode: 302,
      headers: {
        location: "/",
      },
      body: "",
    }
    writeSession(res, createAnonymousSession())
    return res
  }
  return logoutHandler
}
