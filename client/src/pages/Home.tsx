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

      <p>
        TODO:{" "}
        <a href={process.env.PUBLIC_URL + "/auth/login/GOOGLE"}>
          Login with Google
        </a>
      </p>
    </div>
  </Layout>
)

export default Page
