import React from "react"
import { BrowserRouter as Router, Switch, Route } from "react-router-dom"

import Home from "./pages/home"
import About from "./pages/about"
import Data from "./pages/data"
import Privacy from "./pages/policy/privacy"
import Terms from "./pages/policy/terms"

// This site has 3 pages, all of which are rendered
// dynamically in the browser (not server rendered).
//
// Although the page does not ever refresh, notice how
// React Router keeps the URL up to date as you navigate
// through the site. This preserves the browser history,
// making sure things like the back button and bookmarks
// work properly.

export default function BasicExample() {
  return (
    <Router>
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
  )
}
