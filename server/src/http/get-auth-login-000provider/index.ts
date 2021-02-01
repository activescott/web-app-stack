import loginHandlerFactory from "@architect/shared/lambda/oauth/handlers/login"
import userRepositoryFactory from "@architect/shared/lambda/oauth/repository/UserRepository"

export const handler = loginHandlerFactory(userRepositoryFactory())
