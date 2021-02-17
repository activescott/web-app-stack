import { useEffect, useState, SetStateAction, Dispatch } from "react"
import { fetchJson, fetchText } from "./fetch"

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
 * @param initialUrl The url to fetch.
 * @param initialApiResponse The initial response you want to use until the API responds.
 * @returns
 */
export const useApiGet = <TData>(
  initialUrl: string,
  initialApiResponse: TData
): ApiResponseHookResult<TData> => {
  const [url, setUrl] = useState(initialUrl)
  const [response, setResponse] = useState<TData>(initialApiResponse)
  const [isLoading, setIsLoading] = useState(false)
  const [isError, setIsError] = useState(false)
  const [error, setError] = useState<Error | undefined>(undefined)

  useEffect(() => {
    async function fetchApi(): Promise<void> {
      if (!url) {
        // sometimes components don't want to issue a request immediately and only want to use their initialApiResponse state. So if they pass in an empty URL, we don't load anything and don't trigger any errors. They'll call setUrl to request fresh data later.
        setIsLoading(false)
        return
      }
      try {
        setIsLoading(true)
        const rawData = await fetchJson<TData>(url, {
          method: "get",
        })
        setResponse(rawData)
        setIsError(false)
        setError(undefined)
      } catch (reason) {
        // eslint-disable-next-line no-console
        console.error(`Error fetching ${url}:`, reason)
        setError(reason)
        setIsError(true)
      } finally {
        setIsLoading(false)
      }
    }
    fetchApi()
  }, [url])
  // caller can use setUrl to fetch a different page.
  return [{ response, isLoading, isError, error }, setUrl]
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type ApiBodyData = any

/**
 * Request to the local backend API.
 * @param initialUrl The initial Url to request
 * @param initialApiResponse The initial/default response before you get a full response from the server
 * @param requestBody The body to send to the server
 */
export function useApiPost<TResponseData>(
  initialUrl: string,
  initialApiResponse: TResponseData,
  requestBody: ApiBodyData
): ApiResponseHookResult<TResponseData> {
  // NOTE: using the verbose function definition here for better documentation/intellisense
  const hookImp = createApiHook<TResponseData>("POST", true)
  return hookImp(initialUrl, initialApiResponse, requestBody)
}

interface ReactApiHook<TResponseData> {
  (
    initialUrl: string,
    initialApiResponse: TResponseData,
    requestBody?: ApiBodyData
  ): ApiResponseHookResult<TResponseData>
}

/**
 * A helper thunk that creates a useApi* function.
 * @param httpMethod The method the useApi* function is using.
 * @param sendCsrf True if the CSRF token should be requested and included.
 */
function createApiHook<TResponseData>(
  httpMethod: string,
  sendCsrf: boolean = true
): ReactApiHook<TResponseData> {
  /**
   * A hook to use an API response from the local backend API.
   * @param initialUrl The url to fetch. This is a RELATIVE path for the local backend API.
   * @param initialApiResponse The initial response you want to use until the API responds.
   */
  function useApiImp<TResponseData>(
    initialUrl: string,
    initialApiResponse: TResponseData,
    requestBody?: ApiBodyData
  ): ApiResponseHookResult<TResponseData> {
    const [url, setUrl] = useState(initialUrl)
    const [response, setResponse] = useState(initialApiResponse)
    const [isLoading, setIsLoading] = useState(false)
    const [isError, setIsError] = useState(false)
    const csrfToken = useCsrfToken(sendCsrf)

    useEffect(() => {
      async function fetchApi(): Promise<void> {
        try {
          setIsLoading(true)
          const requestInit: RequestInit = {
            method: httpMethod,
            headers: {} as Record<string, string>,
          }
          if (requestBody) {
            requestInit.body = JSON.stringify(requestBody)
          }
          if (sendCsrf) {
            requestInit.headers = {
              ...requestInit.headers,
              "x-csrf-token": await csrfToken,
            }
          }
          const rawData = await fetchJson<TResponseData>(url, requestInit)
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
    }, [url, csrfToken, requestBody])
    return [{ response, isLoading, isError }, setUrl]
  }
  return useApiImp
}

/**
 * A react hook to return the CSRF token used for authorizing API requests for state-changing requests (PUT, POST, UPDATE, DELETE, PATCH, etc. see https://developer.mozilla.org/en-US/docs/Glossary/safe).
 * https://cheatsheetseries.owasp.org/cheatsheets/Cross-Site_Request_Forgery_Prevention_Cheat_Sheet.html#token-based-mitigation
 * @param requestRealToken True if a real CSRF token is needed. False indicates the caller doesn't need the token and the work to fetch it can be avoided.
 */
const useCsrfToken = (requestRealToken = true): Promise<string> => {
  /**
   * What's going on here?
   * The goal here is to always return the same promise to useApi* functions and let them wait in a "loading" state while we resolve the accessToken.
   * If we just were to use useState's `setAccessToken` dispatch, then useApi* ends up failing during the initial renders because there's no accessToken yet available.
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
  useEffect(() => {
    async function getToken(): Promise<void> {
      if (requestRealToken) {
        const promisedToken = fetchText(`${process.env.PUBLIC_URL}/auth/csrf`)
        // now wait on the promise to resolve and when resolved update use it to resolve the original promise that we returned as state:
        promisedToken
          .then(tokenState.resolveToken)
          .catch(tokenState.rejectToken)
      } else {
        tokenState.resolveToken("")
      }
    }
    getToken()
  }, [tokenState.rejectToken, tokenState.resolveToken, requestRealToken])
  return tokenState.promisedToken
}
