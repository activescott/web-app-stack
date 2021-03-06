import * as arc from "@architect/functions"
import { HttpRequest, HttpResponse } from "@architect/functions"

const handlerImp = async function handlerImp(
  req: HttpRequest
): Promise<HttpResponse> {
  return {
    headers: {
      "content-type": "application/json",
    },
    statusCode: 200,
    body: JSON.stringify({
      message:
        "This is a useful debugging tool just to see what a request payload looks like.",
      request: req,
    }),
  }
}

export const handler = arc.http.async(handlerImp)
