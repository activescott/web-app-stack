import React from "react"
import { render } from "@testing-library/react"
import Home from "./Home"
import { MemoryRouter } from "react-router-dom"

test("renders Welcome to our home", () => {
  const { getByText } = render(
    <MemoryRouter>
      <Home />
    </MemoryRouter>
  )
  const elem = getByText(/Welcome to our home./i)
  expect(elem).toBeInTheDocument()
})
