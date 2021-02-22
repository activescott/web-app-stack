import React, { useContext, useEffect, useState } from "react"
import { fetchJson, fetchWithCsrf } from "../../lib/fetch"
import { doLogin, doLogout } from "./authUtil"

type ApiIdentity = {
  id: string
  provider: string
  sub: string
}

/** Defines the attributes of an authenticated user. */
export interface AuthUser {
  /** The unique identifier for the user (the subject). */
  sub: string
  /** Time User last updated (milliseconds since epoch) */
  updatedAt: number
  /** If specified, specifies the email address of the user. */
  email?: string
  /** If specified, specifies the name of the user. */
  name?: string
  /** The list of identities for this user at different authentication providers. */
  identities: ApiIdentity[]
}

export interface ProvidedUserContext {
  user: AuthUser | null
  isAuthenticated: boolean
  isLoading: boolean
  login: (providerName: string) => Promise<void>
  logout: () => Promise<void>
  /** Deletes and effectively unlinks the specified identity from this user. Get the identityID from @see AuthUser.identities . */
  deleteIdentity: (identityID: string) => Promise<void>
  /** Deletes the current user's profile and logs them out */
  deleteUser: () => Promise<void>
  // TODO: add the below login/logout/token implementations:
  // getAccessToken: (options?: AccessTokenOptions) => Promise<string>
}

const DefaultUserContext: ProvidedUserContext = {
  user: null,
  isAuthenticated: false,
  isLoading: true,
  login: async (providerName: string) => {
    doLogin(providerName)
  },
  logout: async () => {
    doLogout()
  },
  deleteIdentity: async (): Promise<void> =>
    Promise.reject(new Error("UserContext not yet initialized")),
  deleteUser: async (): Promise<void> =>
    Promise.reject(new Error("UserContext not yet initialized")),
}

const UserContext = React.createContext<ProvidedUserContext>(DefaultUserContext)
export const useUserContext = (): ProvidedUserContext => useContext(UserContext)

interface Props {
  children?: React.ReactNode
}

export const UserProvider = (props: Props): JSX.Element => {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  async function reloadUser(): Promise<void> {
    try {
      // see if this user is authenticated by calling the UserInfo endpoint
      const userInfo = await fetchJson<AuthUser>(
        `${process.env.PUBLIC_URL}/auth/me`
      )
      setUser(userInfo)
    } catch (e) {
      // TODO: fix fetchJson so we can get the response code and get error body (AuthUser | AuthError).
      // eslint-disable-next-line no-console
      console.warn("Failed to authenticate user: " + e.toString())
    }
    setIsLoading(false)
  }

  useEffect(() => {
    reloadUser()
  }, [])

  return (
    <UserContext.Provider
      value={{
        user,
        isAuthenticated: Boolean(user),
        isLoading,
        login: DefaultUserContext.login,
        logout: DefaultUserContext.logout,
        deleteIdentity: async (identityID: string): Promise<void> => {
          const createDeleteIdentityUrl = (identityId: string): string => {
            const encodedID = encodeURIComponent(identityId)
            return `${process.env.PUBLIC_URL}/auth/me/identities/${encodedID}`
          }

          const response = await fetchWithCsrf(
            createDeleteIdentityUrl(identityID),
            {
              method: "DELETE",
            }
          )
          if (!response.ok) {
            // eslint-disable-next-line no-console
            console.error(
              "deleteIdentity request failed: ",
              response.status,
              response.statusText
            )
          }
          // NOTE: no need to await this reloadUser as it will update setState methods when it's finished
          reloadUser()
        },
        deleteUser: async (): Promise<void> => {
          const response = await fetchWithCsrf(
            `${process.env.PUBLIC_URL}/auth/me/`,
            {
              method: "DELETE",
            }
          )
          if (!response.ok) {
            // eslint-disable-next-line no-console
            console.error(
              "deleteUser request failed: ",
              response.status,
              response.statusText
            )
          }
          DefaultUserContext.logout()
        },
      }}
    >
      {props.children}
    </UserContext.Provider>
  )
}
