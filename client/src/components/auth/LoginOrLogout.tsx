import React from "react"
import { useUserContext } from "./UserProvider"
import SignInWithApple from "./SignInWithApple"
import SignInWithGoogle from "./SignInWithGoogle"

const LoginOrLogout = (): JSX.Element => {
  return (
    <>
      <LogoutLink />
      <LoginLinks />
    </>
  )
}

const LogoutLink = (): JSX.Element | null => {
  const { isAuthenticated, logout } = useUserContext()
  return isAuthenticated ? (
    <button className="dropdown-item" onClick={logout}>
      Logout
    </button>
  ) : null
}

const LoginLinks = (): JSX.Element | null => {
  const { isAuthenticated } = useUserContext()
  return isAuthenticated ? null : (
    <>
      <SignInWithApple buttonClassName="dropdown-item" />
      <SignInWithGoogle buttonClassName="dropdown-item" />
    </>
  )
}

export default LoginOrLogout
