import React from "react"
import Nav from "./Nav"
import "../style/style.scss"
import Foot from "./Foot"
import { Helmet } from "react-helmet"
import Iconic from "./iconic"
import { UserProvider } from "./auth/UserProvider"

// https://nextjs.org/learn/basics/using-shared-components/rendering-children-components

interface Props {
  children?: React.ReactNode
}

const Layout = (props: Props): JSX.Element => {
  return (
    <>
      <Helmet>
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1, shrink-to-fit=no"
        />
      </Helmet>
      <Iconic />
      <UserProvider>
        <Nav />
        <main id="content" className="py-5">
          <div className="container">{props.children}</div>
        </main>
        <Foot />
      </UserProvider>
    </>
  )
}

export default Layout
