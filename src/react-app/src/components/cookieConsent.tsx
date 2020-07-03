import React from "react"
import { Helmet } from "react-helmet"
import { useScriptUrl, useScriptInline } from "../lib/useScript"

// See https://github.com/osano/cookieconsent/ and https://cookieconsent.osano.com/download/#/

const CookieConsent = (): JSX.Element => {
  useScriptUrl("/static/vendor/cookieconsent/cookieconsent.min.js")
  useScriptInline(`window.addEventListener("load", doConsent);
  function doConsent() {
    window.cookieconsent.initialise({
      palette: {
        popup: {
          background: "#4586c6",
          text: "#ffffffc0"
        },
        button: {
          background: "transparent",
          text: "#ffffffc0",
          border: "#ffffffc0"
        }
      },
      content: {
        link: "Learn More",
        href: "/policy/privacy"
      }
    });
  }`)
  return (
    <>
      <Helmet>
        <link
          rel="stylesheet"
          type="text/css"
          href="/static/vendor/cookieconsent/cookieconsent.min.css"
        />
      </Helmet>
    </>
  )
}

export default CookieConsent
