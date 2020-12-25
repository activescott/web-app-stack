import React from "react"
import { render } from "@testing-library/react"
import App from "./App"

test("renders Welcome to our home", () => {
  const { getByText } = render(<App />)
  const elem = getByText(/Welcome to our home./i)
  expect(elem).toBeInTheDocument()
})
