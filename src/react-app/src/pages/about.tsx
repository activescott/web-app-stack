import React from "react"
import Layout from "../components/layout"
import { Helmet } from "react-helmet"

const Page = (): JSX.Element => (
  <Layout>
    <Helmet>
      <title>Acme</title>
    </Helmet>
    <div>
      <h1>About Us</h1>

      <p>We're pretty cool.</p>
    </div>
  </Layout>
)

export default Page
