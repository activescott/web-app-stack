import { useEffect } from "react"
import CC from "@activescott/cookieconsent"

// See https://github.com/activescott/cookieconsent

export const useCookieConsent = (): void => {
  useEffect(() => {
    new CC({
      palette: {
        popup: {
          background: "#4586c6",
          text: "#ffffffc0",
        },
        button: {
          background: "transparent",
          text: "#ffffffc0",
          border: "#ffffffc0",
        },
      },
      content: {
        link: "Learn More",
        href: "/policy/privacy",
      },
    })
  })
}
