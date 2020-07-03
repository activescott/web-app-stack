import React from "react"
import Nav from "./nav"
import "../style/style.scss"
import { useScriptInline } from "../lib/useScript"
import CookieConsent from "./cookieConsent"
import Foot from "./foot"
import { Helmet } from "react-helmet"

// https://nextjs.org/learn/basics/using-shared-components/rendering-children-components

interface Props {
  children?: React.ReactNode
}

const Layout = (props: Props): JSX.Element => {
  useScriptInline(`
  window.addEventListener('load', (event) => {
    var mySVGsToInject = document.querySelectorAll('svg.iconic-icon')
    SVGInjector(mySVGsToInject)
  })`)
  return (
    <>
      <Helmet>
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1, shrink-to-fit=no"
        />
        <link
          rel="stylesheet"
          href="/static/vendor/bootstrap/css/bootstrap.min.css"
        ></link>
        <link
          href="/static/images/iconic/font/css/open-iconic-bootstrap.min.css"
          rel="stylesheet"
        ></link>
      </Helmet>
      <CookieConsent />
      {/* Bootstrap requirements */}
      <script src="/static/vendor/jquery/jquery.slim.min.js"></script>
      <script src="/static/vendor/popper.js/umd/popper.min.js"></script>
      <script src="/static/vendor/bootstrap/js/bootstrap.js"></script>
      {/* for iconic svg icon support https://useiconic.com/open#reference */}
      <script src="/static/vendor/svg-injector/svg-injector.min.js"></script>
      {/* for iconic svg icon support https://useiconic.com/open#reference */}
      <img
        src="/static/images/iconic/sprite/open-iconic.min.svg"
        className="iconic-sprite"
        style={{ display: "none" }}
      />
      <Nav />
      <main id="content" className="py-5">
        <div className="container">{props.children}</div>
      </main>
      <Foot />
    </>
  )
}

export default Layout
