import { render, fireEvent, screen, waitForElementToBeRemoved } from "@testing-library/react";
import axios from "axios";
import React from "react";
import AlertPopUp from "./AlertPopUp";
describe("AlertPopUp component", () => {
  test("Render AlertPopUp component",async () => {
    const toggleDrawer = jest.fn();
    render(<AlertPopUp  alertOpen={true} severity={"success"} message={"Alert open"} handleClose={toggleDrawer}/>);
    expect(screen.getByText("Alert open")).toBeInTheDocument()
  });

  test("Render AlertPopUp component not to be in dom", () => {
    const toggleDrawer = jest.fn();
    render(<AlertPopUp  alertOpen={false} severity={"success"} message={"Alert open"} handleClose={toggleDrawer}/>);
    expect(screen.queryByText("Alert open")).toBe(null)
  });

});