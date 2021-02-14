import React from "react"
import IconicIcon from "../IconicIcon"
import { AuthUser } from "./UserProvider"

interface Props {
  isLoading: boolean
  user: AuthUser | null
}

const Avatar = (props: Props): JSX.Element => {
  const { isLoading, user } = props
  if (isLoading) {
    return <IconicIcon icon="loop-circular" />
  } else if (!user) {
    return <IconicIcon icon="person" />
  } else {
    return (
      <>
        <IconicIcon icon="person" fillColor="white" />
      </>
    )
  }
}

export default Avatar
