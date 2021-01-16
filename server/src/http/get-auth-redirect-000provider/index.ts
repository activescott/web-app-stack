import * as arc from "@architect/functions"
import oAuthRedirectHandlerFactory from "../../lib/architect/oauth/handlers/redirect"
import { tokenRepositoryFactory } from "../../lib/architect/oauth/repository/TokenRepository"
import userRepositoryFactory from "../../lib/architect/oauth/repository/UserRepository"
import { fetchJson } from "../../lib/fetch"

const impl = oAuthRedirectHandlerFactory(
  fetchJson,
  userRepositoryFactory(),
  tokenRepositoryFactory()
)

export const handler = arc.http.async(impl)
