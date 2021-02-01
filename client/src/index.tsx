import React from "react"
import ReactDOM from "react-dom"
// Per open-iconic integration with bootstrap. assumes "open-iconic" package installed.
import "open-iconic/font/css/open-iconic-bootstrap.css"
// Bootstrap: https://getbootstrap.com/docs/4.5/getting-started/introduction/#js & https://create-react-app.dev/docs/adding-bootstrap/
import "bootstrap/dist/css/bootstrap.css"
import "bootstrap/dist/js/bootstrap.bundle.min"
// app-specific CSS loaded after bootstrap so can override
import "./index.css"
import App from "./App"
import * as serviceWorker from "./serviceWorker"

ReactDOM.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
  document.getElementById("root")
)

// If you want your app to work offline and load faster, you can change
// unregister() to register() below. Note this comes with some pitfalls.
// Learn more about service workers: https://bit.ly/CRA-PWA
serviceWorker.unregister()
