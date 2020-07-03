import React from "react"
import { Helmet } from "react-helmet"
import LayoutWithSidebar from "../../components/layoutWithSidebar"
import PolicyNav from "../../components/policyNav"

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
    <h1>Privacy &amp; Cookies Policy</h1>

    <p>Effective date: November 2, 2222</p>

    <p>
      Acme (&quot;us&quot;, &quot;we&quot;, or &quot;our&quot;) operates the
      https://FAKE website (hereinafter referred to as the &quot;Service&quot;).
    </p>

    <p>...</p>

    <p>...</p>

    <h2>Contact Us</h2>
    <p>
      If you have any questions about this Privacy Policy, please don't contact
      us!
    </p>
  </div>
)

export default Page
