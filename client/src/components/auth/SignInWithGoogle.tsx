import React from "react"
import "./SignInWithGoogle.css"
import SignInWithProvider from "./SignInWithProvider"
import providerLogo from "./images/btn_google_light_normal_ios.svg"

const providerName = "GOOGLE"
const providerLabel = "Sign in with Google"

// note styled according to https://developers.google.com/identity/branding-guidelines
const SignInWithGoogle2 = (): JSX.Element => {
  return (
    <SignInWithProvider
      provider={providerName}
      label={providerLabel}
      logoUrl={providerLogo}
      buttonClassName="goog"
    />
  )
}

export default SignInWithGoogle2
