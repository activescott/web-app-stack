import * as arc from "@architect/functions"
import userRepositoryFactory from "@architect/shared/lambda/oauth/repository/UserRepository"
import identityRepositoryFactory from "@architect/shared/lambda/oauth/repository/IdentityRepository"
import meHandlerFactory from "@architect/shared/lambda/oauth/handlers/me"

const handlerImp = meHandlerFactory(
  userRepositoryFactory(),
  identityRepositoryFactory()
)
export const handler = arc.http.async(handlerImp)
