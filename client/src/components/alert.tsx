import React from "react"

interface Props {
  children: React.ReactNode
}

/**
 * A Bootstrap Alert https://getbootstrap.com/docs/4.6/components/alerts/
 */
const Alert = (props: Props): JSX.Element => {
  return (
    <div
      className="alert alert-warning alert-dismissible fade show"
      role="alert"
    >
      {props.children}
      <button
        type="button"
        className="close"
        data-dismiss="alert"
        aria-label="Close"
      >
        <span aria-hidden="true">&times;</span>
      </button>
    </div>
  )
}

export default Alert
