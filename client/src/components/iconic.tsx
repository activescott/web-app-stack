import React from "react"
import { useEffect } from "react"
import iconicSprite from "open-iconic/sprite/sprite.min.svg"
import SVGInjector from "svg-injector"

/**
 * Embeds the open-iconic sprite for using open-iconic SVG icons.
 */
const Iconic = (): JSX.Element => {
  useEffect(() => {
    // https://useiconic.com/open#reference
    /* for iconic svg icon support https://useiconic.com/open#reference */
    const mySVGsToInject = document.querySelectorAll("svg.iconic-icon")
    SVGInjector(mySVGsToInject)
  })
  /* for iconic svg icon support https://useiconic.com/open#reference */
  return (
    <>
      <img
        src={iconicSprite}
        className="iconic-sprite"
        style={{ display: "none" }}
        alt=""
      />
    </>
  )
}

export default Iconic
