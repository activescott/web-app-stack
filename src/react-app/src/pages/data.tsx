import React from "react"
import Layout from "../components/layout"
import { Helmet } from "react-helmet"

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
        <pre>TODO</pre>
      </p>
    </div>
  </Layout>
)

export default Page
