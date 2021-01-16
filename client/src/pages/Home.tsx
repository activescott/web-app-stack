import React from "react"
import Layout from "../components/Layout"
import { Helmet } from "react-helmet"
import { useApiGet } from "../lib/useApiHooks"

const Page = (): JSX.Element => (
  <Layout>
    <Helmet>
      <title>Acme</title>
    </Helmet>
    <div>
      <h1>Home</h1>

      <p>Welcome to our home.</p>

      <p>
        TODO:{" "}
        <a href={process.env.PUBLIC_URL + "/auth/login/GOOGLE"}>
          Login with Google
        </a>
      </p>

      <div>
        <UserInfo />
      </div>
    </div>
  </Layout>
)

const UserInfo: React.FunctionComponent = (): React.ReactElement => {
  const [{ response, isError, isLoading }] = useApiGet(
    `${process.env.PUBLIC_URL}/auth/me`,
    {},
    { requiresAuthentication: false }
  )

  return (
    <div>
      <p>
        If you are currently logged in, you should see some stuff about you
        below:
      </p>
      {isError && <p>Error!</p>}
      {isLoading && <p>Loading...</p>}
      {!isLoading && (
        <pre style={{ border: "1px solid pink" }}>
          {JSON.stringify(response, null, "  ")}
        </pre>
      )}
    </div>
  )
}

export default Page
