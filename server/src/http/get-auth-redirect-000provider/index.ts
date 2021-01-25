import oAuthRedirectHandlerFactory from "@architect/shared/architect/oauth/handlers/redirect"
import tokenRepositoryFactory from "@architect/shared/architect/oauth/repository/TokenRepository"
import userRepositoryFactory from "@architect/shared/architect/oauth/repository/UserRepository"
import { fetchJson } from "@architect/shared/fetch"

const impl = oAuthRedirectHandlerFactory(
  fetchJson,
  userRepositoryFactory(),
  tokenRepositoryFactory()
)

export const handler = impl
