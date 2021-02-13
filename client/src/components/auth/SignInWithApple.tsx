import React from "react"
import "./SignInWithApple.css"
import SignInWithProvider from "./SignInWithProvider"
import providerLogo from "./images/apple_left_black_logo_small.svg"

const providerName = "APPLE"
const providerLabel = "Sign in with Apple"

// note styled according to https://developers.google.com/identity/branding-guidelines
const SignInWithApple = (): JSX.Element => {
  return (
    <SignInWithProvider
      provider={providerName}
      label={providerLabel}
      logoUrl={providerLogo}
      buttonClassName="aapl"
    />
  )
}

export default SignInWithApple
