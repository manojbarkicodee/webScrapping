import React from "react";
import { render, fireEvent, screen } from "@testing-library/react";
import App from "./App";


describe("App component", () => {
  test("renders App component", () => {
    render(<App />);
    expect(screen.getByText("WEB SCRAPING")).toBeInTheDocument();
  });

  test("Check for navabar component", () => {
    render(<App />);
    const navbarElement = screen.getByTestId("navbar");
    expect(navbarElement).toBeInTheDocument();
  });

  test("Check for home component", () => {
    render(<App />);
    const homeElement = screen.getByTestId("home");
    expect(homeElement).toBeInTheDocument();
  });
});
