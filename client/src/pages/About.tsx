import React from "react"
import Layout from "../components/Layout"
import { Helmet } from "react-helmet"

const Page = (): JSX.Element => (
  <Layout>
    <Helmet>
      <title>Acme</title>
    </Helmet>
    <div>
      <h1>About Us</h1>

      <p>We're pretty cool.</p>

      {/* Merely a test of Bootstrap javascript*/}
      <div
        className="alert alert-warning alert-dismissible fade show"
        role="alert"
      >
        <strong>JavaScript test!</strong> If you can see an "X" button to the
        right and it closes this alert, then Bootstrap JavaScript works!
        <button
          type="button"
          className="close"
          data-dismiss="alert"
          aria-label="Close"
        >
          <span aria-hidden="true">&times;</span>
        </button>
      </div>
    </div>
  </Layout>
)

export default Page
