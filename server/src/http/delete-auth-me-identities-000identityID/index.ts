import meDeleteIdentityFactory from "@architect/shared/lambda/oauth/handlers/meDeleteIdentity"
import userRepositoryFactory from "@architect/shared/lambda/oauth/repository/UserRepository"
import identityRepositoryFactory from "@architect/shared/lambda/oauth/repository/IdentityRepository"

export const handler = meDeleteIdentityFactory(
  userRepositoryFactory(),
  identityRepositoryFactory()
)
