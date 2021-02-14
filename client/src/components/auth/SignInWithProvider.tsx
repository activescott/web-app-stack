import React from "react"
import { combineClassNames } from "../../lib/reactUtil"
import "./SignInWithProvider.css"
import { useUserContext } from "./UserProvider"

export interface SignInWithProviderProps {
  provider: string
  label: string
  logoUrl: string
  buttonClassName?: string
}

const SignInWithProvider = (props: SignInWithProviderProps): JSX.Element => {
  const { login } = useUserContext()
  return (
    <button
      className={combineClassNames("sign-in", props.buttonClassName)}
      onClick={() => {
        login(props.provider)
      }}
      {...props}
    >
      <img className="logo" src={props.logoUrl} alt={props.label} />
      <span className="label">{props.label}</span>
    </button>
  )
}

export default SignInWithProvider
