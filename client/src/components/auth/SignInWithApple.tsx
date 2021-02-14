import React from "react"
import "./SignInWithApple.css"
import SignInWithProvider, {
  SignInWithProviderProps,
} from "./SignInWithProvider"
import providerLogo from "./images/apple_left_black_logo_small.svg"
import { combineClassNames } from "../../lib/reactUtil"

const providerName = "APPLE"
const providerLabel = "Sign in with Apple"

type Props = Pick<SignInWithProviderProps, "buttonClassName">

// note styled according to https://developers.google.com/identity/branding-guidelines
const SignInWithApple = (props: Props): JSX.Element => {
  return (
    <SignInWithProvider
      provider={providerName}
      label={providerLabel}
      logoUrl={providerLogo}
      buttonClassName={combineClassNames("aapl ", props.buttonClassName)}
    />
  )
}

export default SignInWithApple
