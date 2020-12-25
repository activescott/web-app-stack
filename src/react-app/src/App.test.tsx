import React from "react"
import { render } from "@testing-library/react"
import App from "./App"

test("renders default route (Home)", () => {
  const { getByText } = render(<App />)
  const elem = getByText(/Welcome to our home./i)
  expect(elem).toBeInTheDocument()
})
