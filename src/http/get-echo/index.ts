import {
  ArchitectHttpRequestPayload,
  ArchitectResponsePayload,
} from "../../lib/architect/http"
import * as arc from "@architect/functions"

const handlerImp = async function handlerImp(
  req: ArchitectHttpRequestPayload
): Promise<ArchitectResponsePayload> {
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
