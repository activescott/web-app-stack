import React, { CSSProperties } from "react"
import openIconicSprite from "open-iconic/sprite/open-iconic.min.svg"

interface Props {
  icon: string
  fillColor?: string
  className?: string
  style?: CSSProperties
}

const IconicIcon = (props: Props): JSX.Element => {
  const className = props.className
    ? "iconic-icon ".concat(props.className)
    : "iconic-icon"
  return (
    <svg viewBox="0 0 8 8" className={className} style={props.style}>
      <use
        xlinkHref={openIconicSprite + "#" + props.icon}
        style={{ fill: props.fillColor }}
      ></use>
    </svg>
  )
}

export default IconicIcon
