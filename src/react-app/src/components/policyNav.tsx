import React from "react"
import { Link } from "react-router-dom"

interface Props {
  orientation?: "vertical" | "horizontal"
}

const PolicyNav = (props: Props): JSX.Element => {
  const classes = ["nav"]
  if (!props.orientation || props.orientation === "vertical") {
    classes.push("flex-column")
  } else {
    // note: align could be it's own prop.
    classes.push("justify-content-end")
  }

  return (
    <ul className={classes.join(" ")}>
      <NavLink href="/policy/terms" label="Terms of Service" />
      <NavLink href="/policy/privacy" label="Privacy &amp; Cookies" />
    </ul>
  )
}

interface NavLinkProps {
  href: string
  label: string
}
const NavLink = (props: NavLinkProps): JSX.Element => {
  const { href, label } = props
  return (
    <li className="nav-item">
      <Link className="nav-link" to={href}>
        {label}
      </Link>
    </li>
  )
}

export default PolicyNav
