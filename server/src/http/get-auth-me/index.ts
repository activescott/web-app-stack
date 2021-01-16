import * as arc from "@architect/functions"
import userRepositoryFactory from "../../lib/architect/oauth/repository/UserRepository"
import meHandlerFactory from "../../lib/architect/oauth/handlers/me"

const handlerImp = meHandlerFactory(userRepositoryFactory())
export const handler = arc.http.async(handlerImp)
