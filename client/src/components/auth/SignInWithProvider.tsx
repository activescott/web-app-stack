import React from "react"
import "./SignInWithProvider.css"
import { doLogin } from "./authUtil"

interface Props {
  provider: string
  label: string
  logoUrl: string
  buttonClassName?: string
}

const SignInWithProvider = (props: Props): JSX.Element => {
  const buttonClassName =
    "sign-in" + (props.buttonClassName ? " " + props.buttonClassName : "")
  return (
    <button
      className={buttonClassName}
      onClick={() => doLogin(props.provider)}
      {...props}
    >
      <img className="logo" src={props.logoUrl} />
      <span className="label">{props.label}</span>
    </button>
  )
}

export default SignInWithProvider
