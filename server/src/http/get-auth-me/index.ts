import * as arc from "@architect/functions"
import userRepositoryFactory from "@architect/shared/architect/oauth/repository/UserRepository"
import meHandlerFactory from "@architect/shared/architect/oauth/handlers/me"

const handlerImp = meHandlerFactory(userRepositoryFactory())
export const handler = arc.http.async(handlerImp)
