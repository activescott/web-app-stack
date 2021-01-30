import oAuthRedirectHandlerFactory from "@architect/shared/architect/oauth/handlers/redirect"
import identityRepositoryFactory from "@architect/shared/architect/oauth/repository/IdentityRepository"
import userRepositoryFactory from "@architect/shared/architect/oauth/repository/UserRepository"
import { fetchJson } from "@architect/shared/fetch"

const impl = oAuthRedirectHandlerFactory(
  fetchJson,
  userRepositoryFactory(),
  identityRepositoryFactory()
)

export const handler = impl
