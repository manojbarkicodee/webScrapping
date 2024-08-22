import { render, fireEvent, screen } from "@testing-library/react";
import Navbar from "./Navbar";
import axios from "axios";
import React from "react";
describe("Navbar component", () => {
  test("Render Navbar component", () => {
    const toggleDrawer = jest.fn();
    render(<Navbar toggleDrawer={toggleDrawer} />);
    expect(screen.getByText("WEB SCRAPING")).toBeInTheDocument();
  });

  test("Check for history icon and trigger click event", () => {
    const toggleDrawer = jest.fn();
    render(<Navbar toggleDrawer={toggleDrawer} />);
    const historyElement = screen.getByTestId("historyIcon");
    expect(historyElement).toBeInTheDocument();
    fireEvent.click(historyElement);
    expect(toggleDrawer).toHaveBeenCalledWith(true);
  });
});
