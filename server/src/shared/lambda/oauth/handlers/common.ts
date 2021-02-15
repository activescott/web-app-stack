import {
  htmlErrorResponse,
  LambdaHttpRequest,
  LambdaHttpResponse,
} from "../../lambda"
import { BAD_REQUEST } from "../../httpStatus"

/**
 * Returns the name of the provider that should be used for authentication from the specified request.
 */
export function getProviderName(
  req: LambdaHttpRequest
): [string, LambdaHttpResponse | null] {
  const PROVIDER_NAME_PARAM = "provider"
  const provider = req.pathParameters
    ? req.pathParameters[PROVIDER_NAME_PARAM]
    : ""
  if (!provider) {
    const err = htmlErrorResponse(
      BAD_REQUEST,
      "provider path parameter must be specified"
    )
    return ["", err]
  }
  return [provider, null]
}
