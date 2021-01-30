import * as arc from "@architect/functions"
import userRepositoryFactory from "@architect/shared/architect/oauth/repository/UserRepository"
import identityRepositoryFactory from "@architect/shared/architect/oauth/repository/IdentityRepository"
import meHandlerFactory from "@architect/shared/architect/oauth/handlers/me"

const handlerImp = meHandlerFactory(
  userRepositoryFactory(),
  identityRepositoryFactory()
)
export const handler = arc.http.async(handlerImp)
