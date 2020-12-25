import React from "react"
import Layout from "../components/Layout"
import { Helmet } from "react-helmet"

const Page = (): JSX.Element => (
  <Layout>
    <Helmet>
      <title>Acme</title>
    </Helmet>
    <div>
      <h1>Home</h1>

      <p>Welcome to our home.</p>
    </div>
  </Layout>
)

export default Page
