import * as arc from "@architect/functions"
import login from "../../lib/architect/oauth/handlers/login"

export const handler = arc.http.async(login)
