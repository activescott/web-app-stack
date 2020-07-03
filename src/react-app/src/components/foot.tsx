import React from "react"
import PolicyNav from "./policyNav"

const Foot = (): JSX.Element => {
  return (
    <footer className="footer py-3">
      <div className="container">
        <div className="justify-content-start"></div>
        <div className="justify-content-end">
          <PolicyNav orientation="horizontal" />
        </div>
      </div>
    </footer>
  )
}

export default Foot
