import React from "react"
import "./SignInWithGoogle.css"
import SignInWithProvider, {
  SignInWithProviderProps,
} from "./SignInWithProvider"
import providerLogo from "./images/btn_google_light_normal_ios.svg"
import { combineClassNames } from "../../lib/reactUtil"

const providerName = "GOOGLE"
const providerLabel = "Sign in with Google"

type Props = Pick<SignInWithProviderProps, "buttonClassName">

// note styled according to https://developers.google.com/identity/branding-guidelines
const SignInWithGoogle = (props: Props): JSX.Element => {
  return (
    <SignInWithProvider
      provider={providerName}
      label={providerLabel}
      logoUrl={providerLogo}
      buttonClassName={combineClassNames("goog", props.buttonClassName)}
    />
  )
}

export default SignInWithGoogle
