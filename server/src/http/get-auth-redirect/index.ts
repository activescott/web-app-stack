import * as arc from "@architect/functions"
import oAuthRedirectHandlerFactory from "../../lib/architect/oauth/handlers/redirect"

const impl = oAuthRedirectHandlerFactory()
export const handler = arc.http.async(impl)
