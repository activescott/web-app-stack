import React from "react"
import { Link } from "react-router-dom"

const links: {
  href: string
  label: string
  external?: boolean
  requiresAdmin?: boolean
  requiresWhitelist?: boolean
}[] = [
  { href: "/", label: "Home" },
  { href: "/data", label: "Data" },
  { href: "/about", label: "About" },
  { href: "/policy/privacy", label: "Privacy" },
  { href: "/policy/terms", label: "Terms" },
]

function navItemClasses(href: string, isActive: boolean): string {
  const classes: string[] = ["nav-item"]
  if (isActive) {
    classes.push("active")
  }
  return classes.join(" ")
}

const Nav = (): JSX.Element => {
  return (
    <header className="navbar navbar-expand-lg navbar-dark">
      <a href="/">
        <h1
          className="navbar-brand text-hide"
          style={{
            width: 36,
            height: 40,
            backgroundImage: "url('/static/images/logo-light.svg')",
            backgroundRepeat: "no-repeat",
          }}
        >
          Acme
        </h1>
      </a>
      <button
        className="navbar-toggler"
        type="button"
        data-toggle="collapse"
        data-target="#navbarSupportedContent"
        aria-controls="navbarSupportedContent"
        aria-expanded="false"
        aria-label="Toggle navigation"
      >
        <span className="navbar-toggler-icon"></span>
      </button>
      <div className="collapse navbar-collapse" id="navbarSupportedContent">
        <ul className="navbar-nav mr-auto">
          {links.map(({ href, label, external }) => {
            //const match = useRouteMatch(href);
            //const isActive: boolean = Boolean(match && match.isExact);
            const isActive = false
            return (
              <li key={href} className={navItemClasses(href, isActive)}>
                {external ? (
                  <a href={href}>{label}</a>
                ) : (
                  <Link to={href} className="nav-link">
                      {label}
                  </Link>
                )}
              </li>
            )
          })}
        </ul>
      </div>
    </header>
  )
}

export default Nav
