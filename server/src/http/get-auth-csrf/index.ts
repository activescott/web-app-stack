import csrfGetHandlerFactory from "@architect/shared/lambda/csrfHandler"

const handlerImp = csrfGetHandlerFactory()
export const handler = handlerImp
