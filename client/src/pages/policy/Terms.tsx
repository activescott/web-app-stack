import React from "react"
import { Helmet } from "react-helmet"
import LayoutWithSidebar from "../../components/LayoutWithSidebar"
import PolicyNav from "../../components/PolicyNav"

const Page = (): JSX.Element => (
  <>
    <Helmet>
      <title>Privacy &amp; Cookies Policy</title>
    </Helmet>
    <LayoutWithSidebar sidebar={renderSidebar()} content={renderContent()} />
  </>
)

const renderSidebar = (): JSX.Element => (
  <>
    <h3>Policies</h3>
    <PolicyNav />
  </>
)

const renderContent = (): JSX.Element => (
  <div>
    <h1>Terms of Service</h1>

    <p>Effective date: November 2, 2222</p>

    <p>Acme is a product of Acme, with offices in the Milky Way Galaxy.</p>

    <p>...</p>

    <p>...</p>

    <h2>Contact Us</h2>
    <p>
      We do not welcome any questions, concerns, or feedback you might have
      about these terms. If you have suggestions for us, please keep them to
      yourself.
    </p>
  </div>
)

export default Page
