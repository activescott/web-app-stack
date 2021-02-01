import React from "react"
import {
  render,
  waitForElementToBeRemoved,
  fireEvent,
} from "@testing-library/react"
import About from "./About"
import { MemoryRouter } from "react-router-dom"

test.skip("bootstrap javascript working", async () => {
  const { getByRole, getByText } = render(
    <MemoryRouter>
      <About />
    </MemoryRouter>
  )
  // we're going to dismiss the alert to enure that Bootstrap's JS is working.
  // first make sure the alert is there

  expect(getByRole("alert")).toBeInstanceOf(HTMLElement)
  // now dismiss it:
  //const btn = getByLabelText("close")
  //const btn = container.querySelector("button[data-dismiss='alert']")
  const btn = getByText("×")
  fireEvent.click(btn)
  await waitForElementToBeRemoved(() => getByRole("alert"))
})
