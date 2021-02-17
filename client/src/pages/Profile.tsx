import React from "react"
import Layout from "../components/Layout"
import { Helmet } from "react-helmet"
import { useUserContext } from "../components/auth/UserProvider"
import LoginOrLogout from "../components/auth/LoginOrLogout"
import IconicIcon from "../components/IconicIcon"
import SignInWithApple from "../components/auth/SignInWithApple"
import SignInWithGoogle from "../components/auth/SignInWithGoogle"

const Page = (): JSX.Element => {
  return (
    <Layout>
      <Helmet>
        <title>Profile</title>
      </Helmet>
      <UserInfo />
    </Layout>
  )
}

const UserInfo = (): JSX.Element => {
  const userContext = useUserContext()
  const { user } = userContext

  if (userContext.isLoading) {
    return <div>Loading...</div>
  }

  if (!userContext.isAuthenticated) {
    return (
      <div>
        <p>Please login to see you profile.</p>
        <LoginOrLogout />
      </div>
    )
  }

  const indent = 2
  const notAvailable = "n/a"
  return (
    <div>
      <IconicIcon icon="person" className="rounded-circle" />
      <div>
        <h2>ID:</h2>
        <p>{user?.sub || notAvailable}</p>
      </div>
      <div>
        <h2>Name:</h2>
        <p>{user?.name || notAvailable}</p>
      </div>

      <div>
        <h2>Email:</h2>
        <p>{user?.email || notAvailable}</p>
      </div>

      <LinkedIdentities />

      <div>
        <h2>Full User Profile:</h2>
        <pre>{JSON.stringify(user, null, indent)}</pre>
      </div>
    </div>
  )
}

const LinkedIdentities = (): JSX.Element => {
  const userContext = useUserContext()
  const { user } = userContext
  return (
    <div>
      <h2>Linked Identities</h2>
      <p>
        Below are the list of identities you have linked to your user. Use the
        unlink button below to unlink any of them. A couple of notes:
        <ul>
          <li>
            You cannot remove your last identity. So the button below is
            disabled if you have only one identity.
          </li>
          <li>
            You can re-link your identity by logging into this user again (with
            a different identity provider) and linking it with the buttons
            above.
          </li>
        </ul>
      </p>
      <ul>
        {user &&
          user.identities.map((identity) => (
            <li>
              {identity.provider}:
              <button
                className="btn btn-warning"
                onClick={() => userContext.deleteIdentity(identity.id)}
                disabled={
                  // eslint-disable-next-line no-magic-numbers
                  user.identities.length < 2
                }
              >
                Unlink
              </button>
            </li>
          ))}
      </ul>
      <div>
        <p>
          If you want to link your profile to an identity at another provider,
          use the below buttons to sign in with the provider:
        </p>
        <div>
          <SignInWithApple />
          <SignInWithGoogle />
        </div>
      </div>
    </div>
  )
}

export default Page
