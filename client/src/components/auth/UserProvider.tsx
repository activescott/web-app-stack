import React, { useContext, useEffect, useState } from "react"
import { fetchJson } from "../../lib/fetch"
import { doLogin, doLogout } from "./authUtil"

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
}

export interface ProvidedUserContext {
  user: AuthUser | null
  isAuthenticated: boolean
  isLoading: boolean
  login: (providerName: string) => Promise<void>
  logout: () => Promise<void>
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
}

const UserContext = React.createContext<ProvidedUserContext>(DefaultUserContext)
export const useUserContext = (): ProvidedUserContext => useContext(UserContext)

interface Props {
  children?: React.ReactNode
}

export const UserProvider = (props: Props): JSX.Element => {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    async function go(): Promise<void> {
      try {
        // see if this user is authenticated by calling the UserInfo endpoint
        const userInfo = await fetchJson<AuthUser>(
          `${process.env.PUBLIC_URL}/auth/me`
        )
        setUser(userInfo)
      } catch (e) {
        // TODO: fix fetchJson so we can get the response code and get error body (AuthUser | AuthError).
        // eslint-disable-next-line no-console
        console.error("Failed to authenticate user: " + e.toString())
      }
      setIsLoading(false)
    }
    go()
  }, [])

  return (
    <UserContext.Provider
      value={{
        user,
        isAuthenticated: Boolean(user),
        isLoading,
        login: DefaultUserContext.login,
        logout: DefaultUserContext.logout,
      }}
    >
      {props.children}
    </UserContext.Provider>
  )
}
