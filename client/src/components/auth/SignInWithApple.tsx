import React from "react"
import SignInWithProvider from "./SignInWithProvider"

// TODO: Style https://developer.apple.com/documentation/sign_in_with_apple/sign_in_with_apple_js/displaying_sign_in_with_apple_buttons
const SignInWithApple = (): JSX.Element => {
  return <SignInWithProvider provider="APPLE" label="Apple" />
}

export default SignInWithApple
