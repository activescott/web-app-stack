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
      <h1>Data</h1>

      <p>
        This page just demonstrates dynamically rendering data from the server's
        API. Below is the result of calling `GET /echo`:
      </p>
      <ApiResult />
    </div>
  </Layout>
)

const ApiResult: React.FunctionComponent = (): React.ReactElement => {
  const [{ response, isError, isLoading }] = useApiGet(
    `${process.env.PUBLIC_URL}/api/echo`,
    {}
  )

  return (
    <div>
      <p>Result:</p>
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
