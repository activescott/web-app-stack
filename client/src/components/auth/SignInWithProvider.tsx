import React from "react"

const SignInWithProvider = (props: {
  provider: string
  label: string
}): JSX.Element => {
  return (
    <button
      type="button"
      className="btn btn-outline-primary d-block btn-signin m-1"
      onClick={() => {
        window.location.href =
          process.env.PUBLIC_URL + `/auth/login/${props.provider}`
      }}
    >
      {`Sign in with ${props.label}`}
    </button>
  )
}

export default SignInWithProvider
