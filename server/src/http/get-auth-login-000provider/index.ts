import * as arc from "@architect/functions"
import login from "@architect/shared/architect/oauth/handlers/login"

export const handler = arc.http.async(login)
