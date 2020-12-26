import React from "react"
import { cleanup, render, screen } from "@testing-library/react"
import App from "./App"

describe("App", () => {
  beforeEach(() => {
    // apparently this is called by default and unmounts the react components...
    cleanup()
    // ...however it doesn't handle cleaning up their side-effects like jsdom elements (such as cookieconsent's injected data) are NOT!
    document.body.innerHTML = ""
  })

  test("renders default route (Home)", () => {
    const { getByText } = render(<App />)
    const elem = getByText(/Welcome to our home./i)
    expect(elem).toBeInstanceOf(HTMLElement)
  })

  test("renders cookieconsent popup", () => {
    const { container } = render(<App />)
    const popup = screen.getByLabelText("cookieconsent")
    expect(popup).toBeInstanceOf(HTMLElement)
  })
})
