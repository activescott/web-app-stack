import oAuthRedirectHandlerFactory from "@architect/shared/lambda/oauth/handlers/redirect"
import identityRepositoryFactory from "@architect/shared/lambda/oauth/repository/IdentityRepository"
import userRepositoryFactory from "@architect/shared/lambda/oauth/repository/UserRepository"
import { fetchJson } from "@architect/shared/fetch"

const impl = oAuthRedirectHandlerFactory(
  fetchJson,
  userRepositoryFactory(),
  identityRepositoryFactory()
)

export const handler = impl
