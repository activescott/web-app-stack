import { useEffect, useState, SetStateAction, Dispatch } from "react"
import { fetchJson } from "./fetch"

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type ApiResponseHookResult<TResponseData> = [
  {
    response: TResponseData
    isLoading: boolean
    isError: boolean
    error?: Error
  },
  Dispatch<SetStateAction<string>>
]

/**
 * A hook to use an API response from the local backend API.
 * @param initialUrl The url to fetch. This is a RELATIVE path for the local backend API.
 * @param initialApiResponse The initial response you want to use until the API responds.
 * @returns
 */
export const useApiGet = <TData>(
  initialUrl: string,
  initialApiResponse: TData,
  options: { requiresAuthentication: boolean } = {
    requiresAuthentication: true,
  }
): ApiResponseHookResult<TData> => {
  const [url, setUrl] = useState(initialUrl)
  const [response, setResponse] = useState<TData>(initialApiResponse)
  const [isLoading, setIsLoading] = useState(false)
  const [isError, setIsError] = useState(false)
  const [error, setError] = useState<Error | undefined>(undefined)
  // TODO: if you need authentication, handle that here...
  //const { isAuthenticated } = useUserContext()
  const isAuthenticated = false
  const accessToken = useAccessToken()

  useEffect(() => {
    async function fetchApi(): Promise<void> {
      if (!url) {
        // sometimes components don't want to issue a request immediately and only want to use their initialApiResponse state. So if they pass in an empty URL, we don't load anything and don't trigger any errors. They'll call setUrl to request fresh data later.
        setIsLoading(false)
        return
      }
      try {
        if (options.requiresAuthentication && !isAuthenticated) {
          // this may not be as bad as it seems; just wait for state to get updated and we'll quite possibly get an authenticated state and continue through this in a subsequen render...
          return
        }
        setIsLoading(true)
        //TODO: WTF, use this resolvedAccessToken and fix it like alert genie.
        const resolvedAccessToken = await accessToken
        const rawData = await fetchJson<TData>(url, {
          method: "get",
        })
        setResponse(rawData)
        setIsError(false)
        setError(undefined)
        setIsLoading(false)
      } catch (reason) {
        // eslint-disable-next-line no-console
        console.error(`Error fetching ${url}:`, reason)
        setIsError(true)
        setError(reason)
      } finally {
        setIsLoading(false)
      }
    }
    fetchApi()
  }, [url, isAuthenticated, options.requiresAuthentication, accessToken])
  // caller can use setUrl to fetch a different page.
  return [{ response, isLoading, isError, error }, setUrl]
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type ApiPostData = any

/**
 * A hook to use an API response from the local backend API.
 * @param initialUrl The url to fetch. This is a RELATIVE path for the local backend API.
 * @param initialApiResponse The initial response you want to use until the API responds.
 */
export const useApiPost = <TData>(
  initialUrl: string,
  initialApiResponse: TData,
  postBody: ApiPostData
): ApiResponseHookResult<TData> => {
  const [url, setUrl] = useState(initialUrl)
  const [response, setResponse] = useState(initialApiResponse)
  const [isLoading, setIsLoading] = useState(false)
  const [isError, setIsError] = useState(false)
  const accessToken = useAccessToken()

  useEffect(() => {
    async function fetchApi(): Promise<void> {
      if (!accessToken) {
        // eslint-disable-next-line no-console
        console.error("No access token but useApiPost requires it")
        return
      }
      try {
        setIsLoading(true)
        /*
        const rawData = await new BackendApi().post<TData, ApiPostData>(url, {
          body: postBody,
          authorization: await accessToken
        })
        */
        const rawData = await fetchJson<TData>(url, {
          body: JSON.stringify(postBody),
          method: "post",
          //TODO: Authorization: authorization: await accessToken
        })
        setResponse(rawData)
        setIsError(false)
      } catch (reason) {
        // eslint-disable-next-line no-console
        console.error(`Error posting to ${url}:`, reason)
        setIsError(true)
      } finally {
        setIsLoading(false)
      }
    }
    fetchApi()
  }, [url, accessToken, postBody])
  return [{ response, isLoading, isError }, setUrl]
}

/**
 * A react hook to return the access token used for authorizing API requests.
 */
const useAccessToken = (): Promise<string> => {
  /**
   * What's going on here?
   * The goal here is to always return the same promise to useApi* functions and let then wait in a "loading" state while we resolve the accessToken.
   * If we just were to use useState's `setAccessToken` dispatch, then it will useApi* ends up failing during the initial renders because there's no accessToken yet available.
   * So we keep a pending Promise as the state, and don't ever change the state, but we also keep the Promise's resolve function around so we can later resolve it.
   * This lets useApi* sit in a loading state while it waits on our promise.
   */

  // type used internally to mange the promise as state
  type TokenResolver = {
    promisedToken: Promise<string>
    resolveToken: (token: string) => void
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    rejectToken: (reason: any) => void
  }
  // note we will never reset this token (only resolve it), so we don't catch the dispatch/setter
  const [tokenState] = useState<TokenResolver>(() => {
    let resolveToken: (token: string) => void = () => null
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let rejectToken: (reason: any) => void = () => null
    const promisedToken = new Promise<string>((resolve, reject) => {
      resolveToken = resolve
      rejectToken = reject
    })
    return {
      promisedToken,
      resolveToken,
      rejectToken,
    }
  })
  // TODO: const userContext = useUserContext()
  const userContext = null
  useEffect(() => {
    async function getToken(): Promise<void> {
      /*
      if (userContext && userContext.isAuthenticated) {
        const promisedToken = userContext.getAccessToken({
          audience: AUTH_AUDIENCE(process.env.BUILD_ENV),
          scope: AUTH_SCOPE(process.env.BUILD_ENV),
        })
        // now wait on the promise to resolve and when resolved update use it to resolve the original promise that we returned as state:
        promisedToken
          .then(tokenState.resolveToken)
          .catch(tokenState.rejectToken)
      }
      */
     // TODO: Implement a proper local token (get it from cookie?)
      tokenState.resolveToken("not yet implemented")
    }
    getToken()
  }, [
    tokenState.rejectToken,
    tokenState.resolveToken,
    userContext,
    //userContext.isAuthenticated
  ])
  return tokenState.promisedToken
}
