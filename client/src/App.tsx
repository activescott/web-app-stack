import React from "react"
import { BrowserRouter as Router, Switch, Route } from "react-router-dom"
import Home from "./pages/Home"
import About from "./pages/About"
import Data from "./pages/Data"
import Privacy from "./pages/policy/Privacy"
import Terms from "./pages/policy/Terms"
import { useCookieConsent } from "./lib/cookieConsent"

export default function App(): JSX.Element {
  useCookieConsent()
  return (
    <>
      {/*
    For why `basename` see https://stackoverflow.com/a/56055153/51061
    */}
      <noscript hidden>PUBLIC_URL: {process.env.PUBLIC_URL}</noscript>
      <Router basename={process.env.PUBLIC_URL}>
        <div>
          {/*
          A <Switch> looks through all its children <Route>
          elements and renders the first one whose path
          matches the current URL. Use a <Switch> any time
          you have multiple routes, but you want only one
          of them to render at a time
        */}
          <Switch>
            <Route exact path="/">
              <Home />
            </Route>
            <Route path="/data">
              <Data />
            </Route>
            <Route path="/about">
              <About />
            </Route>
            <Route path="/policy/privacy">
              <Privacy />
            </Route>
            <Route path="/policy/terms">
              <Terms />
            </Route>
          </Switch>
        </div>
      </Router>
    </>
  )
}
